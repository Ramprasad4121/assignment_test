/**
 * @fileoverview Header wallet button (Problem 3): persistent connect/disconnect
 * indicator shown in the app bar on every authenticated page. Reuses the
 * shared {@link useWallet} hook so state stays in sync with the
 * issue-certificate page.
 */
import * as React from 'react';
import { Button, Tooltip } from '@mui/material';
import { AccountBalanceWalletOutlined } from '@mui/icons-material';
import { useWallet } from '../hooks/useWallet';

/**
 * Shorten an address for display (`0x1234…abcd`).
 * @param address Full hex address or null.
 */
const shortAddress = (address: string | null): string =>
  address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';

/**
 * App-bar wallet button. Shows "Connect Wallet" when disconnected,
 * the shortened address when connected.
 * @returns button element.
 */
export const WalletButton: React.FC = () => {
  const { wallet, connect, wrongNetwork } = useWallet();

  if (!wallet.isConnected) {
    return (
      <Button
        size='small'
        variant='outlined'
        startIcon={<AccountBalanceWalletOutlined />}
        onClick={connect}
        sx={{ mr: 1 }}
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <Tooltip title={wrongNetwork ? `Wrong network — expected chain ${wallet.chainId}` : (wallet.address ?? '')}>
      <Button
        size='small'
        variant={wrongNetwork ? 'contained' : 'outlined'}
        color={wrongNetwork ? 'warning' : 'primary'}
        startIcon={<AccountBalanceWalletOutlined />}
        sx={{ mr: 1, textTransform: 'none' }}
      >
        {shortAddress(wallet.address)}
      </Button>
    </Tooltip>
  );
};
