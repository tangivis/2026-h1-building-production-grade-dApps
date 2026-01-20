import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface ConnectWalletProps {
    onConnect: (account: string, provider: ethers.BrowserProvider) => void;
}

// Expected network configuration - Default to local Polkadot EVM
const EXPECTED_CHAIN_ID = 420420420; // Local Polkadot EVM

export const ConnectWallet = ({ onConnect }: ConnectWalletProps) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');
    const [currentChainId, setCurrentChainId] = useState<number | null>(null);

    useEffect(() => {
        // Check current network when mounted
        checkNetwork();

        // Listen for chain changes
        if (typeof window.ethereum !== 'undefined') {
            const handleChainChanged = (chainId: string) => {
                window.location.reload();
            };
            window.ethereum.on('chainChanged', handleChainChanged);
            return () => {
                window.ethereum?.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, []);

    const checkNetwork = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const network = await provider.getNetwork();
                setCurrentChainId(Number(network.chainId));
            } catch (e) {
                console.error('Failed to get network', e);
            }
        }
    };

    const connect = async () => {
        setIsConnecting(true);
        setError('');

        try {
            // Check if MetaMask is installed
            if (typeof window.ethereum === 'undefined') {
                setError('MetaMask is not installed');
                setIsConnecting(false);
                return;
            }

            const provider = new ethers.BrowserProvider(window.ethereum);

            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

            if (accounts.length > 0) {
                // Get current network
                const network = await provider.getNetwork();
                const chainId = Number(network.chainId);
                setCurrentChainId(chainId);

                // For local development, allow connection even on wrong network
                // User will see a warning but can still interact
                onConnect(accounts[0], provider);
            } else {
                setError('No accounts found');
            }
        } catch (err: any) {
            console.error('Connection error:', err);
            if (err.code === 4001) {
                setError('Connection rejected by user');
            } else {
                setError(err.message || 'Failed to connect');
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const isWrongNetwork = currentChainId !== null && currentChainId !== EXPECTED_CHAIN_ID;

    return (
        <div className="connect-wallet-container">
            {isWrongNetwork && (
                <div className="network-warning" style={{
                    marginBottom: '10px',
                    padding: '10px',
                    background: '#ff6b6b33',
                    borderRadius: '8px',
                    fontSize: '12px',
                    lineHeight: '1.4'
                }}>
                    <div><strong>Wrong Network!</strong></div>
                    <div style={{ marginTop: '4px' }}>
                        Current: {currentChainId} | Expected: {EXPECTED_CHAIN_ID}
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '11px', opacity: 0.8 }}>
                        Please add network manually in MetaMask:<br/>
                        Chain ID: {EXPECTED_CHAIN_ID}<br/>
                        RPC URL: http://127.0.0.1:8545
                    </div>
                </div>
            )}
            <button onClick={connect} disabled={isConnecting} className="connect-btn">
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
            {error && <p className="error-msg">{error}</p>}
        </div>
    );
};
