import { useState, useEffect } from 'react';
import { usePublicClient, useWaitForTransactionReceipt } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { parseEther } from 'viem';
import { MiniSwap_ABI, ERC20_ABI } from '../constants';
import { useMiniSwapWrite, useTokenBalance, useTokenDecimals, formatBalance, getTokenAddresses, getContractAddress } from '../hooks/useContracts';

interface SwapProps {
    address: string;
}

type TokenSymbol = 'USDT' | 'USDC' | 'DOT' | 'CUSTOM';

interface TokenOption {
    symbol: TokenSymbol;
    address: string;
    name: string;
}

const DEFAULT_TOKEN_OPTIONS: TokenOption[] = [
    { symbol: 'USDT', address: '', name: 'Mini USDT (from deployment)' },
    { symbol: 'USDC', address: '', name: 'Mini USDC (from deployment)' },
    { symbol: 'DOT', address: '', name: 'Mini DOT (from deployment)' },
    { symbol: 'CUSTOM', address: '', name: 'Custom Address' },
];

export const Swap = ({ address }: SwapProps) => {
    const publicClient = usePublicClient();
    const queryClient = useQueryClient();
    const { swap, approve, useAllowance, isPending } = useMiniSwapWrite();

    const [tokenIn, setTokenIn] = useState<TokenSymbol>('USDT');
    const [tokenOut, setTokenOut] = useState<TokenSymbol>('USDC');
    const [customTokenIn, setCustomTokenIn] = useState('');
    const [customTokenOut, setCustomTokenOut] = useState('');
    const [amountIn, setAmountIn] = useState('');
    const [status, setStatus] = useState('');
    const [miniSwapAddress, setMiniSwapAddress] = useState('');
    const [tokenOptions, setTokenOptions] = useState<TokenOption[]>(DEFAULT_TOKEN_OPTIONS);
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

    // Load deployment config
    useEffect(() => {
        const setup = async () => {
            const address = await getContractAddress();
            setMiniSwapAddress(address);

            const tokens = await getTokenAddresses();
            const options: TokenOption[] = [
                { symbol: 'USDT', address: tokens.USDT || '', name: 'Mini USDT' },
                { symbol: 'USDC', address: tokens.USDC || '', name: 'Mini USDC' },
                { symbol: 'DOT', address: tokens.DOT || '', name: 'Mini DOT' },
                { symbol: 'CUSTOM', address: '', name: 'Custom Address' },
            ];
            setTokenOptions(options);
        };
        setup();
    }, []);

    const getTokenAddress = (symbol: TokenSymbol, customAddress: string): string => {
        if (symbol === 'CUSTOM') return customAddress;
        return tokenOptions.find(t => t.symbol === symbol)?.address || '';
    };

    const tokenInAddress = getTokenAddress(tokenIn, customTokenIn);
    const tokenOutAddress = getTokenAddress(tokenOut, customTokenOut);

    // Fetch balances
    const { data: balanceIn, refetch: refetchBalanceIn } = useTokenBalance(tokenInAddress, address);
    const { data: decimalsIn } = useTokenDecimals(tokenInAddress);
    const { data: balanceOut, refetch: refetchBalanceOut } = useTokenBalance(tokenOutAddress, address);
    const { data: decimalsOut } = useTokenDecimals(tokenOutAddress);

    // Check allowance
    const { data: allowance, refetch: refetchAllowance } = useAllowance(
        tokenInAddress,
        address,
        miniSwapAddress
    );

    // Wait for transaction and refetch
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({
        hash: txHash,
        query: {
            enabled: !!txHash,
            onSuccess: async () => {
                console.log('Swap transaction confirmed, refetching all data...');
                setAmountIn('');
                setStatus('Transaction successful!');
                // Refetch all balances after confirmation
                await Promise.all([
                    refetchBalanceIn(),
                    refetchBalanceOut(),
                    refetchAllowance(),
                ]);
                // Also invalidate all queries to ensure everything is fresh
                queryClient.invalidateQueries();
                // Clear txHash after a delay
                setTimeout(() => setTxHash(undefined), 1000);
            },
            onError: (error) => {
                console.error('Transaction error:', error);
                setStatus('Transaction failed!');
                setTxHash(undefined);
            },
        },
    });

    const handleSwap = async () => {
        if (!miniSwapAddress) {
            setStatus('Contract not deployed. Please deploy contracts first.');
            return;
        }

        const amount = amountIn || '0';
        const amountWei = parseEther(amount);
        if (amountWei === 0n) {
            setStatus('Please enter an amount');
            return;
        }

        try {
            setStatus('Checking allowance...');

            // Check if we need to approve
            const currentAllowance = allowance || 0n;
            if (currentAllowance < amountWei) {
                setStatus('Approving token... (Ignore gas warnings, click Proceed)');
                try {
                    const approveHash = await approve(tokenInAddress, miniSwapAddress, amount);
                    if (approveHash) {
                        setTxHash(approveHash as `0x${string}`);
                        // Wait for approval
                        await new Promise(resolve => setTimeout(resolve, 4000));
                        refetchAllowance();
                    }
                } catch (approveErr: any) {
                    if (approveErr.code === 4001) {
                        setStatus('Approval rejected by user');
                        return;
                    }
                    console.warn('Approval warning:', approveErr);
                }
            }

            setStatus('Swapping... (Ignore gas warnings, click Proceed)');
            const hash = await swap(tokenInAddress, tokenOutAddress, amount);

            if (hash) {
                setTxHash(hash as `0x${string}`);
                setStatus('Waiting for confirmation...');
            } else {
                setStatus('Swap successful!');
                // Refetch balances
                await Promise.all([
                    refetchBalanceIn(),
                    refetchBalanceOut(),
                ]);
                setAmountIn('');
            }
        } catch (err: any) {
            console.error(err);
            // User rejected transaction
            if (err.code === 4001) {
                setStatus('Transaction rejected by user');
            } else {
                setStatus(`Swap failed: ${err.message || 'Unknown error'}`);
            }
            setTxHash(undefined);
        }
    };

    const formatTokenBalance = (balance: bigint | undefined, decimals: number | undefined) => {
        const formatted = formatBalance(balance, decimals);
        return formatted !== '--' ? `Balance: ${parseFloat(formatted).toFixed(2)}` : 'Balance: --';
    };

    const isProcessing = isPending || isConfirming;

    return (
        <div className="card">
            <h2>Swap Tokens</h2>

            <div className="input-group">
                <label>From</label>
                <select
                    value={tokenIn}
                    onChange={(e) => setTokenIn(e.target.value as TokenSymbol)}
                >
                    {tokenOptions.map(token => (
                        <option key={token.symbol} value={token.symbol}>
                            {token.name}
                        </option>
                    ))}
                </select>
                {tokenIn === 'CUSTOM' && (
                    <input
                        placeholder="Custom token address"
                        value={customTokenIn}
                        onChange={(e) => setCustomTokenIn(e.target.value)}
                    />
                )}
                <input
                    type="number"
                    placeholder="0.0"
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                />
                <small className="balance-info">{formatTokenBalance(balanceIn, decimalsIn)}</small>
            </div>

            <div className="swap-arrow">↓</div>

            <div className="input-group">
                <label>To</label>
                <select
                    value={tokenOut}
                    onChange={(e) => setTokenOut(e.target.value as TokenSymbol)}
                >
                    {tokenOptions.map(token => (
                        <option key={token.symbol} value={token.symbol}>
                            {token.name}
                        </option>
                    ))}
                </select>
                {tokenOut === 'CUSTOM' && (
                    <input
                        placeholder="Custom token address"
                        value={customTokenOut}
                        onChange={(e) => setCustomTokenOut(e.target.value)}
                    />
                )}
                <small className="balance-info">{formatTokenBalance(balanceOut, decimalsOut)}</small>
            </div>

            <button onClick={handleSwap} disabled={!amountIn || !miniSwapAddress || isProcessing}>
                {isProcessing ? 'Processing...' : miniSwapAddress ? 'Swap' : 'Please Deploy Contracts'}
            </button>
            {status && <p className="status-msg">{status}</p>}
            {!miniSwapAddress && (
                <p className="status-msg" style={{ color: '#ff6b6b' }}>
                    Deploy contracts first: <code>npm run deploy</code>
                </p>
            )}
        </div>
    );
};
