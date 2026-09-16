/**
 * @fileoverview Issue-certificate page (Problem 3, admin/issuer side).
 * Flow: connect wallet -> fill form -> metadata pinned to IPFS ->
 * `issueCertificate` on chain -> new cert id shown.
 */
import * as React from 'react';
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { PageContentHeader } from '@/components/page-content-header';
import { AddCircleOutline } from '@mui/icons-material';
import { useWallet } from '../hooks/useWallet';
import { buildMetadata, hashAchievement, uploadMetadataToIPFS } from '../ipfs';
import { issueCertificate } from '../contract-service';
import { isCertContractConfigured } from '../config';

/**
 * Admin certificate issuance form.
 * @returns page element.
 */
export const IssueCertificatePage: React.FC = () => {
  const { wallet, error: walletError, connect, wrongNetwork } = useWallet();
  const [form, setForm] = React.useState({ studentId: '', studentName: '', achievement: '', description: '' });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<{ certId: number; cid: string; pinned: boolean } | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onIssue = async () => {
    setError(null);
    setDone(null);
    if (!wallet.isConnected) {
      setError('Connect your issuer wallet first.');
      return;
    }
    setBusy(true);
    try {
      const meta = buildMetadata(
        {
          name: `${form.achievement} — ${form.studentName}`,
          description: form.description,
          studentId: Number(form.studentId),
          studentName: form.studentName,
          achievement: form.achievement
        },
        wallet.address ?? ''
      );
      const [hash, up] = await Promise.all([hashAchievement(meta), uploadMetadataToIPFS(meta)]);
      const certId = await issueCertificate(Number(form.studentId), up.cid, hash);
      setDone({ certId, cid: up.cid, pinned: up.pinned });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Issuance failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageContentHeader icon={<AddCircleOutline sx={{ mr: 1 }} />} heading='Issue Certificate' />
      {!isCertContractConfigured() && (
        <Alert severity='warning' sx={{ mb: 2 }}>
          Contract not configured. Deploy (`blockchain/`) and set VITE_CERT_CONTRACT_ADDRESS.
        </Alert>
      )}
      {(error || walletError) && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error ?? walletError}
        </Alert>
      )}
      {wrongNetwork && (
        <Alert severity='warning' sx={{ mb: 2 }}>
          Wallet is on the wrong network for the configured VITE_CHAIN_ID.
        </Alert>
      )}
      {done && (
        <Alert severity={done.pinned ? 'success' : 'warning'} sx={{ mb: 2 }}>
          Issued certificate #{done.certId} (CID: {done.cid}
          {done.pinned ? '' : ' — offline placeholder, pin metadata to IPFS for production'}).
        </Alert>
      )}
      <Paper sx={{ p: 3 }}>
        {!wallet.isConnected && (
          <Button variant='outlined' onClick={connect} sx={{ mb: 2 }}>
            Connect issuer wallet
          </Button>
        )}
        {wallet.isConnected && (
          <Typography variant='body2' sx={{ mb: 2 }}>
            Issuer: {wallet.address}
          </Typography>
        )}
        <Stack spacing={2}>
          <TextField size='small' label='Student ID' value={form.studentId} onChange={set('studentId')} fullWidth />
          <TextField size='small' label='Student name' value={form.studentName} onChange={set('studentName')} fullWidth />
          <TextField size='small' label='Achievement' value={form.achievement} onChange={set('achievement')} fullWidth />
          <TextField size='small' label='Description' value={form.description} onChange={set('description')} fullWidth multiline rows={3} />
          <LoadingButton loading={busy} variant='contained' onClick={onIssue}>
            Pin to IPFS + issue on-chain
          </LoadingButton>
        </Stack>
      </Paper>
    </>
  );
};
