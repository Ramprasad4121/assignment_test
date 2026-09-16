/**
 * @fileoverview Certificates hub page (Problem 3): public verification by
 * certificate id + lookup of a student's certificates. No wallet needed
 * for reads (wallet provider is only used when available).
 */
import * as React from 'react';
import { Alert, Box, Paper, Stack, TextField, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { PageContentHeader } from '@/components/page-content-header';
import { WorkspacePremiumOutlined } from '@mui/icons-material';
import { verifyCertificate, certificatesOfStudent } from '../contract-service';
import { isCertContractConfigured } from '../config';
import type { VerifiedCertificate } from '../types';

const ResultLine: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Typography variant='body2'>
    <strong>{label}:</strong> {value}
  </Typography>
);

/**
 * Certificates admin/verify hub.
 * @returns page element with verify form and student lookup.
 */
export const CertificatesPage: React.FC = () => {
  const [certId, setCertId] = React.useState('');
  const [studentId, setStudentId] = React.useState('');
  const [checking, setChecking] = React.useState(false);
  const [result, setResult] = React.useState<VerifiedCertificate | null>(null);
  const [list, setList] = React.useState<VerifiedCertificate[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const onVerify = async () => {
    setError(null);
    setResult(null);
    setChecking(true);
    try {
      setResult(await verifyCertificate(Number(certId)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setChecking(false);
    }
  };

  const onLookupStudent = async () => {
    setError(null);
    setList([]);
    setChecking(true);
    try {
      setList(await certificatesOfStudent(Number(studentId)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lookup failed');
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <PageContentHeader icon={<WorkspacePremiumOutlined sx={{ mr: 1 }} />} heading='Certificates' />
      {!isCertContractConfigured() && (
        <Alert severity='warning' sx={{ mb: 2 }}>
          Contract not configured. Deploy (`blockchain/`) and set VITE_CERT_CONTRACT_ADDRESS.
        </Alert>
      )}
      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant='h6'>Verify certificate</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <TextField
              size='small'
              label='Certificate ID'
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              fullWidth
            />
            <LoadingButton loading={checking} variant='contained' onClick={onVerify}>
              Verify
            </LoadingButton>
          </Box>
          {result && (
            <Box sx={{ mt: 2 }}>
              <Alert severity={result.valid ? 'success' : 'error'} sx={{ mb: 1 }}>
                {result.valid ? 'Valid certificate' : 'Invalid / revoked / unknown'}
              </Alert>
              <ResultLine label='Student ID' value={String(result.studentId)} />
              <ResultLine label='Issuer' value={result.issuer} />
              <ResultLine label='Issued' value={result.issuedAt?.toLocaleString() ?? '-'} />
              <ResultLine label='Metadata CID' value={result.metadataCID || '-'} />
            </Box>
          )}
        </Paper>
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant='h6'>Certificates of student</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <TextField
              size='small'
              label='Student ID'
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              fullWidth
            />
            <LoadingButton loading={checking} variant='contained' onClick={onLookupStudent}>
              Lookup
            </LoadingButton>
          </Box>
          <Box sx={{ mt: 2 }}>
            {list.map((c) => (
              <Typography key={c.certId} variant='body2'>
                #{c.certId} — {c.valid ? 'valid' : 'revoked'} — {c.metadataCID}
              </Typography>
            ))}
          </Box>
        </Paper>
      </Stack>
    </>
  );
};
