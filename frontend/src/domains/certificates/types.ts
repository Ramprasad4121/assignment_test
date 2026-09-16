/**
 * @fileoverview Shared types for the certificates domain (Problem 3).
 * On-chain truth lives in `SchoolCertificates`; IPFS holds the human-readable
 * metadata. These types mirror both sides.
 */

/** Canonical metadata JSON pinned to IPFS for one certificate. */
export type CertificateMetadata = {
  name: string;
  description: string;
  studentId: number;
  studentName: string;
  achievement: string;
  issuedAt: string;
  issuer: string;
  image?: string;
};

/** Result of `verifyCertificate` on the contract, UI-friendly. */
export type VerifiedCertificate = {
  valid: boolean;
  certId: number;
  studentId: number;
  issuer: string;
  issuedAt: Date | null;
  metadataCID: string;
  achievementHash: string;
};

/** Payload for issuing (form -> IPFS -> chain). */
export type IssueCertificateRequest = {
  studentId: number;
  studentName: string;
  achievement: string;
  description: string;
  image?: string;
};

/** Connected wallet state. */
export type WalletState = {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
};
