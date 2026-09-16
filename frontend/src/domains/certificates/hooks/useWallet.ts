/**
 * @fileoverview Read-only wallet hook (Problem 3).
 * Uses `window.ethereum` (MetaMask / any EIP-1193 wallet) via ethers v6
 * `BrowserProvider`. No auto-connect on mount — the user clicks Connect.
 */
import * as React from 'react';
import { ethers } from 'ethers';
import type { WalletState } from '../types';
import { CERT_CHAIN_ID } from '../config';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
  }
}

const initialState: WalletState = { address: null, chainId: null, isConnected: false };

/**
 * Connect to the browser wallet and track account/chain changes.
 * @returns wallet state plus `connect` and `provider` getter.
 */
export const useWallet = () => {
  const [wallet, setWallet] = React.useState<WalletState>(initialState);
  const [error, setError] = React.useState<string | null>(null);

  const connect = React.useCallback(async (): Promise<boolean> => {
    setError(null);
    if (!window.ethereum) {
      setError('No Web3 wallet found. Install MetaMask to issue certificates.');
      return false;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts: string[] = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();
      setWallet({
        address: accounts[0] ?? null,
        chainId: Number(network.chainId),
        isConnected: (accounts[0] ?? null) !== null
      });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Wallet connection failed');
      return false;
    }
  }, []);

  React.useEffect(() => {
    if (!window.ethereum?.on) return;
    const onAccounts = (accs: string[]) =>
      setWallet((w: WalletState) => ({ ...w, address: accs[0] ?? null, isConnected: (accs[0] ?? null) !== null }));
    const onChain = (hexId: string) =>
      setWallet((w: WalletState) => ({ ...w, chainId: Number.parseInt(hexId, 16) }));
    window.ethereum.on('accountsChanged', onAccounts);
    window.ethereum.on('chainChanged', onChain);
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccounts);
      window.ethereum.removeListener('chainChanged', onChain);
    };
  }, []);

  const wrongNetwork = wallet.chainId !== null && wallet.chainId !== CERT_CHAIN_ID;

  return { wallet, error, connect, wrongNetwork };
};
