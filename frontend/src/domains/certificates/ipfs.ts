/**
 * @fileoverview IPFS helpers for certificate metadata (Problem 3).
 * Upload order: metadata JSON -> IPFS -> CID passed to
 * `issueCertificate(studentId, metadataCID, achievementHash)`.
 *
 * Pinning backends (first configured wins):
 * 1. Pinata (`VITE_PINATA_JWT`) — `POST /pinning/pinJSONToIPFS`.
 * 2. Offline fallback — deterministic `sha256` digest as a pseudo-CID so the
 *    demo works without keys. The chain still records it; swap in a real CID
 *    later by re-issuing. Never used silently: callers surface a warning.
 */
import type { CertificateMetadata } from './types';

const PINATA_JWT: string = import.meta.env.VITE_PINATA_JWT || '';

/**
 * Build the canonical metadata object for a certificate.
 * Field order is fixed so `achievementHash` is reproducible.
 */
export const buildMetadata = (
  input: Omit<CertificateMetadata, 'issuedAt' | 'issuer'>,
  issuer: string
): CertificateMetadata => ({
  ...input,
  issuedAt: new Date().toISOString(),
  issuer
});

/**
 * keccak256 of the canonical fields, as a hex string.
 * Must match what is passed as `achievementHash` at issuance so verifiers
 * can detect tampered IPFS content. Uses ethers (already a dependency).
 */
export const hashAchievement = async (meta: CertificateMetadata): Promise<string> => {
  const { ethers } = await import('ethers');
  const canonical = JSON.stringify([
    meta.studentId,
    meta.studentName,
    meta.achievement,
    meta.description,
    meta.issuedAt
  ]);
  return ethers.keccak256(ethers.toUtf8Bytes(canonical));
};

/**
 * Pin metadata JSON to IPFS. Returns the CID (without `ipfs://` prefix).
 * @throws when Pinata is configured but the pin request fails.
 */
export const uploadMetadataToIPFS = async (meta: CertificateMetadata): Promise<{ cid: string; pinned: boolean }> => {
  if (PINATA_JWT) {
    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PINATA_JWT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinataContent: meta })
    });
    if (!res.ok) throw new Error(`Pinata pin failed: ${res.status}`);
    const data = (await res.json()) as { IpfsHash: string };
    return { cid: data.IpfsHash, pinned: true };
  }
  const { ethers } = await import('ethers');
  const digest = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(meta))).slice(2);
  return { cid: `sha256-${digest}`, pinned: false };
};

/** Resolve a stored CID to fetchable gateway URLs (for the verify page). */
export const cidToGateways = (cid: string): string[] => {
  if (cid.startsWith('sha256-')) return [];
  const clean = cid.replace(/^ipfs:\/\//, '');
  return [`https://ipfs.io/ipfs/${clean}`, `https://gateway.pinata.cloud/ipfs/${clean}`];
};
