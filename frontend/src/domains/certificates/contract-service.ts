/**
 * @fileoverview Contract service: thin ethers wrappers around
 * `SchoolCertificates` (Problem 3). Read calls use a public RPC/default
 * provider; write calls require the connected wallet signer.
 */
import { ethers } from 'ethers';
import { CERTIFICATE_ABI } from './contract-abi';
import { CERT_CONTRACT_ADDRESS, isCertContractConfigured } from './config';
import type { VerifiedCertificate } from './types';

const getReadContract = (): ethers.Contract => {
  if (!isCertContractConfigured()) throw new Error('Certificate contract address is not configured (VITE_CERT_CONTRACT_ADDRESS).');
  const provider = new ethers.BrowserProvider(window.ethereum);
  return new ethers.Contract(CERT_CONTRACT_ADDRESS, CERTIFICATE_ABI, provider);
};

const getWriteContract = async (): Promise<ethers.Contract> => {
  if (!isCertContractConfigured()) throw new Error('Certificate contract address is not configured (VITE_CERT_CONTRACT_ADDRESS).');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(CERT_CONTRACT_ADDRESS, CERTIFICATE_ABI, signer);
};

/**
 * Verify one certificate id. Never throws for unknown ids — returns
 * `{ valid: false }`, mirroring the contract's UI-friendly behavior.
 */
export const verifyCertificate = async (certId: number): Promise<VerifiedCertificate> => {
  const contract = getReadContract();
  const [valid, studentId, issuer, issuedAt, metadataCID, achievementHash] = (await contract.verifyCertificate(
    certId
  )) as [boolean, bigint, string, bigint, string, string];
  return {
    valid,
    certId,
    studentId: Number(studentId),
    issuer,
    issuedAt: issuedAt === 0n ? null : new Date(Number(issuedAt) * 1000),
    metadataCID,
    achievementHash
  };
};

/**
 * List certificate ids for a student, then verify each (skips invalid).
 */
export const certificatesOfStudent = async (studentId: number): Promise<VerifiedCertificate[]> => {
  const contract = getReadContract();
  const ids = (await contract.certificatesOfStudent(studentId)) as bigint[];
  const out: VerifiedCertificate[] = [];
  for (const id of ids) {
    const v = await verifyCertificate(Number(id));
    out.push(v);
  }
  return out;
};

/**
 * Issue a certificate (requires issuer wallet). Returns the new cert id
 * parsed from the `CertificateIssued` event.
 */
export const issueCertificate = async (
  studentId: number,
  metadataCID: string,
  achievementHash: string
): Promise<number> => {
  const contract = await getWriteContract();
  const tx = (await contract.issueCertificate(studentId, metadataCID, achievementHash)) as ethers.TransactionResponse;
  const receipt = (await tx.wait()) as ethers.TransactionReceipt;
  const iface = new ethers.Interface(CERTIFICATE_ABI);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed?.name === 'CertificateIssued') return Number(parsed.args[0]);
    } catch {
      continue;
    }
  }
  throw new Error('Issued but cert id not found in receipt logs');
};

/** Revoke a certificate (issuer or admin wallet). */
export const revokeCertificate = async (certId: number): Promise<void> => {
  const contract = await getWriteContract();
  const tx = (await contract.revokeCertificate(certId)) as ethers.TransactionResponse;
  await tx.wait();
};
