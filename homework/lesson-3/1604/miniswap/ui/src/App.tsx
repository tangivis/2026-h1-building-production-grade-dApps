import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'
import { ConnectWallet } from './components/ConnectWallet'
import { RPC, CHAIN_ID_HEX } from './constants'

// Placeholder components
import { Swap } from './components/Swap'
import { Liquidity } from './components/Liquidity'

function App() {
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [canSendTx, setCanSendTx] = useState<boolean>(false)
  const [chainId, setChainId] = useState<string | null>(null)
  const [networkError, setNetworkError] = useState<string | null>(null)

  const handleConnect = (connectedAccount: string, connectedProvider: ethers.BrowserProvider, _canSendTx: boolean) => {
    setAccount(connectedAccount)
    setProvider(connectedProvider)
    setCanSendTx(_canSendTx)
    setNetworkError(null)
  }

  useEffect(() => {
    if (!provider) return;
    (async () => {
      try {
        const cid = await provider.send('eth_chainId', []);
        setChainId(cid);
      } catch (e) {
        console.warn('Failed to query chainId from provider', e);
      }
    })();
  }, [provider]);

  const switchToPassetHub = async () => {
    setNetworkError(null);
    const ethAny = (window as any).ethereum;
    if (!ethAny) {
      setNetworkError('No injected wallet found');
      return;
    }
    try {
      await ethAny.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
      // Refresh chainId
      if (provider) {
        const cid = await provider.send('eth_chainId', []);
        setChainId(cid);
      }
    } catch (err: any) {
      // 4902 => chain not added
      if (err && err.code === 4902) {
        try {
          await ethAny.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: CHAIN_ID_HEX,
                chainName: 'PassetHub Testnet',
                rpcUrls: [RPC],
                nativeCurrency: { name: 'Pas', symbol: 'PAS', decimals: 18 },
              },
            ],
          });
          await ethAny.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
          if (provider) {
            const cid = await provider.send('eth_chainId', []);
            setChainId(cid);
          }
        } catch (e: any) {
          setNetworkError(e?.message || 'Failed to add/switch network');
        }
      } else {
        setNetworkError(err?.message || 'Failed to switch network');
      }
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>MiniSwap Interface</h1>
        {account ? (
          <div className="account-display">
            <div>Connected: {account.slice(0, 6)}...{account.slice(-4)}</div>
            <div className="chain-status">Chain: {chainId || 'unknown'}</div>
            {chainId !== CHAIN_ID_HEX && (
              <div>
                <button onClick={switchToPassetHub} className="switch-btn">Switch to PassetHub</button>
                {networkError && <div className="error-msg">{networkError}</div>}
              </div>
            )}
          </div>
        ) : (
          <ConnectWallet onConnect={handleConnect} />
        )}
      </header>

      <main>
        {account && provider && (
          <div className="dashboard">
            {!canSendTx && (
              <div className="warning-banner">⚠️ Connected wallet cannot send transactions; please use MetaMask or another EVM wallet</div>
            )}
            <Swap provider={provider} account={account} canSendTx={canSendTx} />
            <Liquidity provider={provider} account={account} canSendTx={canSendTx} />
          </div>
        )}
        {!account && (
          <p className="welcome-msg">Please connect your wallet to start.</p>
        )}
      </main>
    </div>
  )
}

export default App
