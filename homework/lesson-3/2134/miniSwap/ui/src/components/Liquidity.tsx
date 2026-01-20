import { useState, useEffect } from 'react';
import { usePublicClient, useWaitForTransactionReceipt } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { parseEther, isAddress } from 'viem';
import { MiniSwap_ABI, ERC20_ABI } from '../constants';
import { useMiniSwapWrite, useTokenBalance, useTokenDecimals, formatBalance, getTokenAddresses, getContractAddress } from '../hooks/useContracts';

interface LiquidityProps {
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

export const Liquidity = ({ address }: LiquidityProps) => {
    const publicClient = usePublicClient();
    const queryClient = useQueryClient();
    const { addLiquidity, removeLiquidity, approve, useAllowance, isPending } = useMiniSwapWrite();

    const [mode, setMode] = useState<'add' | 'remove'>('add');
    const [tokenA, setTokenA] = useState<TokenSymbol>('USDT');
    const [tokenB, setTokenB] = useState<TokenSymbol>('USDC');
    const [customTokenA, setCustomTokenA] = useState('');
    const [customTokenB, setCustomTokenB] = useState('');
    const [amount, setAmount] = useState('');
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

    const tokenAAddress = getTokenAddress(tokenA, customTokenA);
    const tokenBAddress = getTokenAddress(tokenB, customTokenB);

    // Fetch balances
    const { data: balanceA, refetch: refetchBalanceA } = useTokenBalance(tokenAAddress, address);
    const { data: decimalsA } = useTokenDecimals(tokenAAddress);
    const { data: balanceB, refetch: refetchBalanceB } = useTokenBalance(tokenBAddress, address);
    const { data: decimalsB } = useTokenDecimals(tokenBAddress);

    // Check allowances
    const { data: allowanceA, refetch: refetchAllowanceA } = useAllowance(tokenAAddress, address, miniSwapAddress);
    const { data: allowanceB, refetch: refetchAllowanceB } = useAllowance(tokenBAddress, address, miniSwapAddress);

    // Wait for transaction and refetch
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({
        hash: txHash,
        query: {
            enabled: !!txHash,
            onSuccess: async () => {
                console.log('Liquidity transaction confirmed, refetching all data...');
                setAmount('');
                setStatus('Transaction successful!');
                // Refetch all balances after confirmation
                await Promise.all([
                    refetchBalanceA(),
                    refetchBalanceB(),
                    refetchAllowanceA(),
                    refetchAllowanceB(),
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

    const handleAddLiquidity = async () => {
        if (!miniSwapAddress) {
            setStatus('Contract not deployed. Please deploy contracts first.');
            return;
        }

        if (!isAddress(tokenAAddress) || !isAddress(tokenBAddress)) {
            setStatus('Invalid token addresses');
            return;
        }

        const amountWei = parseEther(amount || '0');
        if (amountWei === 0n) {
            setStatus('Please enter an amount');
            return;
        }

        try {
            // Approve Token A if needed
            const currentAllowanceA = allowanceA || 0n;
            if (currentAllowanceA < amountWei) {
                setStatus('Approving Token A... (Ignore gas warnings, click Proceed)');
                try {
                    const approveHash = await approve(tokenAAddress, miniSwapAddress, amount);
                    if (approveHash) {
                        setTxHash(approveHash as `0x${string}`);
                        // Wait for transaction confirmation
                        await new Promise(resolve => setTimeout(resolve, 4000));
                        refetchAllowanceA();
                    }
                } catch (approveErr: any) {
                    // If user rejected, don't continue
                    if (approveErr.code === 4001) {
                        setStatus('Approval rejected by user');
                        return;
                    }
                    // Otherwise log but continue (might be a gas estimation warning)
                    console.warn('Token A approval warning:', approveErr);
                }
            }

            // Approve Token B if needed
            const currentAllowanceB = allowanceB || 0n;
            if (currentAllowanceB < amountWei) {
                setStatus('Approving Token B... (Ignore gas warnings, click Proceed)');
                try {
                    const approveHash = await approve(tokenBAddress, miniSwapAddress, amount);
                    if (approveHash) {
                        setTxHash(approveHash as `0x${string}`);
                        // Wait for transaction confirmation
                        await new Promise(resolve => setTimeout(resolve, 4000));
                        refetchAllowanceB();
                    }
                } catch (approveErr: any) {
                    if (approveErr.code === 4001) {
                        setStatus('Approval rejected by user');
                        return;
                    }
                    console.warn('Token B approval warning:', approveErr);
                }
            }

            setStatus('Adding liquidity... (Ignore gas warnings, click Proceed)');
            const hash = await addLiquidity(tokenAAddress, tokenBAddress, amount);

            if (hash) {
                setTxHash(hash as `0x${string}`);
                setStatus('Waiting for confirmation...');
            } else {
                setStatus('Liquidity Added Successfully!');
                // Refetch balances
                await Promise.all([
                    refetchBalanceA(),
                    refetchBalanceB(),
                ]);
                setAmount('');
            }
        } catch (err: any) {
            console.error(err);
            // User rejected transaction
            if (err.code === 4001) {
                setStatus('Transaction rejected by user');
            } else {
                setStatus(`Failed: ${err.message || 'Unknown error'}`);
            }
            setTxHash(undefined);
        }
    };

    const handleRemoveLiquidity = async () => {
        if (!miniSwapAddress) {
            setStatus('Contract not deployed. Please deploy contracts first.');
            return;
        }

        if (!isAddress(tokenAAddress) || !isAddress(tokenBAddress)) {
            setStatus('Invalid token addresses');
            return;
        }

        const amountWei = parseEther(amount || '0');
        if (amountWei === 0n) {
            setStatus('Please enter an amount');
            return;
        }

        try {
            setStatus('Removing liquidity... (Ignore gas warnings, click Proceed)');
            const hash = await removeLiquidity(tokenAAddress, tokenBAddress, amount);

            if (hash) {
                setTxHash(hash as `0x${string}`);
                setStatus('Waiting for confirmation...');
            } else {
                setStatus('Liquidity Removed Successfully!');
                // Refetch balances
                await Promise.all([
                    refetchBalanceA(),
                    refetchBalanceB(),
                ]);
                setAmount('');
            }
        } catch (err: any) {
            console.error(err);
            // User rejected transaction
            if (err.code === 4001) {
                setStatus('Transaction rejected by user');
            } else {
                setStatus(`Failed: ${err.message || 'Unknown error'}`);
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
            <h2>Liquidity</h2>
            <div className="tabs">
                <button className={mode === 'add' ? 'active' : ''} onClick={() => setMode('add')}>Add</button>
                <button className={mode === 'remove' ? 'active' : ''} onClick={() => setMode('remove')}>Remove</button>
            </div>

            <div className="input-group">
                <label>Token A</label>
                <select
                    value={tokenA}
                    onChange={(e) => setTokenA(e.target.value as TokenSymbol)}
                >
                    {tokenOptions.map(token => (
                        <option key={token.symbol} value={token.symbol}>
                            {token.name}
                        </option>
                    ))}
                </select>
                {tokenA === 'CUSTOM' && (
                    <input
                        placeholder="Custom token address"
                        value={customTokenA}
                        onChange={(e) => setCustomTokenA(e.target.value)}
                    />
                )}
                <small className="balance-info">{formatTokenBalance(balanceA, decimalsA)}</small>
            </div>

            <div className="input-group">
                <label>Token B</label>
                <select
                    value={tokenB}
                    onChange={(e) => setTokenB(e.target.value as TokenSymbol)}
                >
                    {tokenOptions.map(token => (
                        <option key={token.symbol} value={token.symbol}>
                            {token.name}
                        </option>
                    ))}
                </select>
                {tokenB === 'CUSTOM' && (
                    <input
                        placeholder="Custom token address"
                        value={customTokenB}
                        onChange={(e) => setCustomTokenB(e.target.value)}
                    />
                )}
                <small className="balance-info">{formatTokenBalance(balanceB, decimalsB)}</small>
            </div>

            {mode === 'add' && (
                <>
                    <div className="input-group">
                        <label>Amount (1:1 ratio)</label>
                        <input
                            type="number"
                            placeholder="0.0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <button onClick={handleAddLiquidity} disabled={!amount || !miniSwapAddress || isProcessing}>
                        {isProcessing ? 'Processing...' : miniSwapAddress ? 'Add Liquidity' : 'Please Deploy Contracts'}
                    </button>
                </>
            )}

            {mode === 'remove' && (
                <>
                    <div className="input-group">
                        <label>Liquidity Amount</label>
                        <input
                            type="number"
                            placeholder="0.0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <button onClick={handleRemoveLiquidity} disabled={!amount || !miniSwapAddress || isProcessing}>
                        {isProcessing ? 'Processing...' : miniSwapAddress ? 'Remove Liquidity' : 'Please Deploy Contracts'}
                    </button>
                </>
            )}

            {status && <p className="status-msg">{status}</p>}
            {!miniSwapAddress && (
                <p className="status-msg" style={{ color: '#ff6b6b' }}>
                    Deploy contracts first: <code>npm run deploy</code>
                </p>
            )}
        </div>
    );
};
