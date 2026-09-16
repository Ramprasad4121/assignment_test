# School Management — Certificate Verification (Problem 3: Blockchain Challenge)

On-chain issuance + verification for student achievement certificates, with
off-chain metadata on IPFS. The chain stores the minimum needed to verify:
who earned it, who issued it, when, a content hash, and an IPFS CID.

## Layout

```text
blockchain/
├── src/SchoolCertificates.sol  # contract (full NatSpec)
├── test/SchoolCertificates.t.sol
├── script/Deploy.s.sol
├── foundry.toml
└── README.md                    # this file
```

Frontend integration lives in `frontend/src/domains/certificates/`:
wallet hook (`useWallet`), contract service (`contract-service.ts`),
IPFS helper (`ipfs.ts`), admin + verify pages, and routes.

## Contract quick reference

- `issueCertificate(studentId, metadataCID, achievementHash) -> certId`
  restricted to `admin` or authorized `issuers`.
- `revokeCertificate(certId)` — issuer who created it, or admin.
- `verifyCertificate(certId)` — returns `(valid, studentId, issuer,
  issuedAt, metadataCID, achievementHash)`. `valid = exists && !revoked`.
- `certificatesOfStudent(studentId) -> uint256[]`.
- `isIssuer(account)`, `setIssuer(account, allowed)` (admin only).

## Build / test (Foundry)

```bash
cd blockchain
forge build
forge test -vv
```

## Deploy (Anvil local, then Sepolia)

```bash
# local
anvil &
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 \
  --private-key <ANVIL_KEY> --broadcast

# sepolia
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_KEY
```

Copy the deployed address into `frontend/.env`:

```env
VITE_CERT_CONTRACT_ADDRESS=0x...
VITE_CHAIN_ID=11155111
```

## IPFS metadata shape

```json
{
  "name": "Science Fair Winner — Grade 10",
  "description": "First place, district science fair 2026",
  "studentId": 12,
  "studentName": "Asha Rao",
  "achievement": "Science Fair Winner",
  "issuedAt": "2026-09-16T00:00:00.000Z",
  "issuer": "0xAdminOrTeacher...",
  "image": "ipfs://.../badge.png"
}
```

Upload order: metadata JSON -> IPFS (Pinata if `VITE_PINATA_JWT` is set,
else deterministic `ipfs://` placeholder for offline demo) -> `metadataCID`
passed to `issueCertificate`. Verification reads the CID back from chain and
resolves it through `https://ipfs.io/ipfs/<cid>` / `https://gateway.pinata.cloud/ipfs/<cid>`.

## Security notes

- Identity gate is `msg.sender` + `issuers` allowlist. Never `tx.origin`
  (phishable, breaks smart-contract wallets).
- Metadata itself is off-chain; chain stores `achievementHash`
  (`keccak256` of canonical fields) so tampered IPFS content is detectable.
- Revocation is on-chain and permanent in history (`CertificateRevoked`
  event) — `verifyCertificate` returns `valid=false` after revoke.
