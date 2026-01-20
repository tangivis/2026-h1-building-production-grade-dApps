import { useState, useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import './App.css'

// RainbowKit ConnectButton
import { ConnectButton } from '@rainbow-me/rainbowkit';

// Components
import { Swap } from './components/Swap'
import { Liquidity } from './components/Liquidity'

function App() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>MiniSwap</h1>
        <div className="wallet-connection">
          <ConnectButton />
          {isConnected && chain?.id !== 420420420 && chain?.id !== 420420422 && (
            <div style={{
              marginLeft: '10px',
              padding: '8px 12px',
              background: '#ff6b6b33',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#ff6b6b'
            }}>
              Wrong network! Please switch to Local Polkadot EVM (420420420)
            </div>
          )}
        </div>
      </header>

      <main>
        {isConnected && address ? (
          <div className="dashboard">
            <Swap address={address} />
            <Liquidity address={address} />
          </div>
        ) : (
          <p className="welcome-msg">Please connect your wallet to start.</p>
        )}
      </main>
    </div>
  )
}

export default App
