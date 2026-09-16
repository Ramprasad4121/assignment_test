// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SchoolCertificates
/// @author Ramprasad
/// @notice On-chain issuance and verification of student achievement certificates.
/// @dev Design notes:
///  - The chain is the source of truth for *validity* (issued? revoked? by whom?).
///    Human-readable metadata (name, achievement text, badge image) lives on IPFS;
///    only the CID plus a content hash are stored on-chain.
///  - Identity is always `msg.sender` against an `issuers` allowlist. `tx.origin`
///    is deliberately never used (phishable and incompatible with smart wallets).
///  - Revocation is a state flip plus an event, so history stays auditable and
///    {verifyCertificate} reports `valid == false` afterwards.
contract SchoolCertificates {
    /*//////////////////////////////////////////////////////////////
                                 TYPES
    //////////////////////////////////////////////////////////////*/

    /// @notice A single issued certificate.
    /// @param studentId Off-chain student id (`users.id` in Postgres).
    /// @param issuer Address that issued it (must have been an authorized issuer).
    /// @param issuedAt Block timestamp of issuance.
    /// @param revoked True once revoked; never un-revoked.
    /// @param metadataCID IPFS CID (no `ipfs://` prefix) of the JSON metadata.
    /// @param achievementHash keccak256 hash of the canonical achievement fields,
    ///        so tampered IPFS content is detectable off-chain.
    struct Certificate {
        uint256 studentId;
        address issuer;
        uint64 issuedAt;
        bool revoked;
        string metadataCID;
        bytes32 achievementHash;
    }

    /*//////////////////////////////////////////////////////////////
                                 STATE
    //////////////////////////////////////////////////////////////*/

    /// @notice Admin address (deployer). Manages the issuer allowlist.
    address public admin;

    /// @notice Next certificate id to mint. Starts at 1 so 0 means "nonexistent".
    uint256 public nextCertId = 1;

    /// @notice certId => Certificate record.
    mapping(uint256 certId => Certificate) private _certificates;

    /// @notice studentId => list of certIds ever issued to that student.
    mapping(uint256 studentId => uint256[] certIds) private _certsOfStudent;

    /// @notice Addresses allowed to issue (and revoke their own) certificates.
    mapping(address account => bool allowed) public isIssuer;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a certificate is issued.
    /// @param certId New certificate id.
    /// @param studentId Off-chain student id.
    /// @param issuer Issuing address.
    /// @param metadataCID IPFS CID of the metadata JSON.
    /// @param achievementHash Content hash of the canonical fields.
    event CertificateIssued(
        uint256 indexed certId,
        uint256 indexed studentId,
        address indexed issuer,
        string metadataCID,
        bytes32 achievementHash
    );

    /// @notice Emitted when a certificate is revoked (history stays on-chain).
    /// @param certId Revoked certificate id.
    /// @param revokedBy Address that performed the revocation.
    event CertificateRevoked(uint256 indexed certId, address indexed revokedBy);

    /// @notice Emitted when the issuer allowlist changes.
    /// @param account Address updated.
    /// @param allowed New allowlist state.
    event IssuerUpdated(address indexed account, bool allowed);

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Caller is not the admin.
    error NotAdmin();
    /// @notice Caller is not admin nor an authorized issuer.
    error NotIssuer();
    /// @notice Certificate id does not exist.
    error CertNotFound(uint256 certId);
    /// @notice Certificate was already revoked.
    error AlreadyRevoked(uint256 certId);
    /// @notice Only the original issuer (or admin) may revoke.
    error NotRevoker();
    /// @notice A required parameter is empty/zero.
    error BadParam();

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /// @dev Reverts with {NotAdmin} unless `msg.sender == admin`.
    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    /// @dev Reverts with {NotIssuer} unless sender is admin or allowlisted.
    modifier onlyIssuer() {
        if (msg.sender != admin && !isIssuer[msg.sender]) revert NotIssuer();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @notice Deploys the registry and sets the admin to the deployer.
    /// @dev The deployer is automatically an issuer-equivalent (admin bypasses
    ///      the allowlist) so no extra setup tx is needed.
    /// @param _admin Admin address. Must not be the zero address.
    constructor(address _admin) {
        if (_admin == address(0)) revert BadParam();
        admin = _admin;
    }

    /*//////////////////////////////////////////////////////////////
                           ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Add or remove an issuer from the allowlist.
    /// @dev Only callable by admin. Emits {IssuerUpdated}.
    /// @param account Address to update. Must not be zero.
    /// @param allowed True to authorize, false to remove.
    function setIssuer(address account, bool allowed) external onlyAdmin {
        if (account == address(0)) revert BadParam();
        isIssuer[account] = allowed;
        emit IssuerUpdated(account, allowed);
    }

    /// @notice Transfer admin to a new address.
    /// @dev Only callable by admin. The old admin keeps no privileges.
    /// @param newAdmin New admin address. Must not be zero.
    function transferAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert BadParam();
        admin = newAdmin;
    }

    /*//////////////////////////////////////////////////////////////
                           ISSUANCE / REVOKE
    //////////////////////////////////////////////////////////////*/

    /// @notice Issue a certificate to a student.
    /// @dev Caller must be admin or allowlisted. `studentId` must be nonzero,
    ///      `metadataCID` non-empty, cert ids start at 1.
    ///      Emits {CertificateIssued}.
    /// @param studentId Off-chain student id (`users.id`).
    /// @param metadataCID IPFS CID of the metadata JSON (without `ipfs://`).
    /// @param achievementHash keccak256 of canonical achievement fields.
    /// @return certId The newly minted certificate id.
    function issueCertificate(
        uint256 studentId,
        string calldata metadataCID,
        bytes32 achievementHash
    ) external onlyIssuer returns (uint256 certId) {
        if (studentId == 0 || bytes(metadataCID).length == 0) revert BadParam();
        certId = nextCertId++;
        _certificates[certId] = Certificate({
            studentId: studentId,
            issuer: msg.sender,
            issuedAt: uint64(block.timestamp),
            revoked: false,
            metadataCID: metadataCID,
            achievementHash: achievementHash
        });
        _certsOfStudent[studentId].push(certId);
        emit CertificateIssued(certId, studentId, msg.sender, metadataCID, achievementHash);
    }

    /// @notice Revoke a certificate permanently.
    /// @dev Callable by the original issuer or admin. Reverts if missing or
    ///      already revoked. Emits {CertificateRevoked}.
    /// @param certId Certificate to revoke.
    function revokeCertificate(uint256 certId) external {
        Certificate storage cert = _certificates[certId];
        if (cert.issuer == address(0)) revert CertNotFound(certId);
        if (cert.revoked) revert AlreadyRevoked(certId);
        if (msg.sender != admin && msg.sender != cert.issuer) revert NotRevoker();
        cert.revoked = true;
        emit CertificateRevoked(certId, msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                                VIEWS
    //////////////////////////////////////////////////////////////*/

    /// @notice Read a certificate record.
    /// @dev Reverts with {CertNotFound} for unknown ids.
    /// @param certId Certificate id.
    /// @return cert The stored Certificate struct.
    function getCertificate(uint256 certId) external view returns (Certificate memory cert) {
        cert = _certificates[certId];
        if (cert.issuer == address(0)) revert CertNotFound(certId);
    }

    /// @notice Verify validity plus details in one call (for UIs).
    /// @dev Never reverts for unknown ids: returns `valid == false` instead,
    ///      so public verification pages need no try/catch.
    /// @param certId Certificate id.
    /// @return valid True iff the certificate exists and is not revoked.
    /// @return studentId Off-chain student id (0 when unknown).
    /// @return issuer Issuing address (zero when unknown).
    /// @return issuedAt Issuance timestamp (0 when unknown).
    /// @return metadataCID IPFS CID (empty when unknown).
    /// @return achievementHash Content hash (zero when unknown).
    function verifyCertificate(uint256 certId)
        external
        view
        returns (
            bool valid,
            uint256 studentId,
            address issuer,
            uint64 issuedAt,
            string memory metadataCID,
            bytes32 achievementHash
        )
    {
        Certificate storage cert = _certificates[certId];
        if (cert.issuer == address(0)) {
            return (false, 0, address(0), 0, "", bytes32(0));
        }
        return (
            !cert.revoked,
            cert.studentId,
            cert.issuer,
            cert.issuedAt,
            cert.metadataCID,
            cert.achievementHash
        );
    }

    /// @notice List all certificate ids ever issued to a student.
    /// @param studentId Off-chain student id.
    /// @return certIds Array of certificate ids (empty when none).
    function certificatesOfStudent(uint256 studentId) external view returns (uint256[] memory certIds) {
        return _certsOfStudent[studentId];
    }
}
