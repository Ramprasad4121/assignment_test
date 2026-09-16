/**
 * @fileoverview Contract configuration: address + chain id from Vite env.
 * Set these in `frontend/.env` after deploying (see `blockchain/README.md`).
 */
export const CERT_CONTRACT_ADDRESS: string =
  import.meta.env.VITE_CERT_CONTRACT_ADDRESS || '';

export const CERT_CHAIN_ID: number = Number(import.meta.env.VITE_CHAIN_ID || '11155111');

/** True when a deployment is configured and the UI can talk to chain. */
export const isCertContractConfigured = (): boolean =>
  CERT_CONTRACT_ADDRESS.startsWith('0x') && CERT_CONTRACT_ADDRESS.length === 42;
