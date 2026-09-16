// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SchoolCertificates.sol";

/// @title SchoolCertificatesTest
/// @notice Foundry test-suite for {SchoolCertificates}: issuance, verification,
///         revocation, issuer allowlist, and edge cases.
/// @dev Uses three actors: admin (deployer), issuer (teacher), stranger.
contract SchoolCertificatesTest is Test {
    SchoolCertificates private certs;
    address private admin = makeAddr("admin");
    address private issuer = makeAddr("issuer");
    address private stranger = makeAddr("stranger");

    /// @notice Deploy a fresh registry and allowlist one issuer before each test.
    function setUp() public {
        vm.prank(admin);
        certs = new SchoolCertificates(admin);
        vm.prank(admin);
        certs.setIssuer(issuer, true);
    }

    /// @notice Issuer can issue; verify returns valid with stored fields.
    function test_IssueAndVerify() public {
        vm.prank(issuer);
        uint256 id = certs.issueCertificate(12, "QmTestCid", keccak256("science-fair"));
        assertEq(id, 1);
        (bool valid, uint256 sid, address who,, string memory cid,) = certs.verifyCertificate(id);
        assertTrue(valid);
        assertEq(sid, 12);
        assertEq(who, issuer);
        assertEq(cid, "QmTestCid");
    }

    /// @notice Unknown ids verify as invalid instead of reverting (UI-friendly).
    function test_VerifyUnknownReturnsInvalid() public view {
        (bool valid,,,,,) = certs.verifyCertificate(999);
        assertFalse(valid);
    }

    /// @notice Strangers cannot issue.
    function test_NonIssuerCannotIssue() public {
        vm.prank(stranger);
        vm.expectRevert(SchoolCertificates.NotIssuer.selector);
        certs.issueCertificate(1, "cid", bytes32(uint256(1)));
    }

    /// @notice Zero student id and empty CID are rejected.
    function test_BadParamsRevert() public {
        vm.prank(issuer);
        vm.expectRevert(SchoolCertificates.BadParam.selector);
        certs.issueCertificate(0, "cid", bytes32(uint256(1)));
        vm.prank(issuer);
        vm.expectRevert(SchoolCertificates.BadParam.selector);
        certs.issueCertificate(1, "", bytes32(uint256(1)));
    }

    /// @notice Original issuer can revoke; afterwards verify is invalid.
    function test_RevokeByIssuer() public {
        vm.prank(issuer);
        uint256 id = certs.issueCertificate(5, "cid5", bytes32(uint256(5)));
        vm.prank(issuer);
        certs.revokeCertificate(id);
        (bool valid,,,,,) = certs.verifyCertificate(id);
        assertFalse(valid);
    }

    /// @notice Double revoke reverts; strangers cannot revoke.
    function test_RevokeEdgeCases() public {
        vm.prank(issuer);
        uint256 id = certs.issueCertificate(6, "cid6", bytes32(uint256(6)));
        vm.prank(stranger);
        vm.expectRevert(SchoolCertificates.NotRevoker.selector);
        certs.revokeCertificate(id);
        vm.prank(issuer);
        certs.revokeCertificate(id);
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(SchoolCertificates.AlreadyRevoked.selector, id));
        certs.revokeCertificate(id);
    }

    /// @notice Admin can revoke any certificate.
    function test_AdminCanRevokeAny() public {
        vm.prank(issuer);
        uint256 id = certs.issueCertificate(7, "cid7", bytes32(uint256(7)));
        vm.prank(admin);
        certs.revokeCertificate(id);
        (bool valid,,,,,) = certs.verifyCertificate(id);
        assertFalse(valid);
    }

    /// @notice Removing an issuer blocks future issuance.
    function test_RemoveIssuer() public {
        vm.prank(admin);
        certs.setIssuer(issuer, false);
        assertFalse(certs.isIssuer(issuer));
        vm.prank(issuer);
        vm.expectRevert(SchoolCertificates.NotIssuer.selector);
        certs.issueCertificate(1, "cid", bytes32(uint256(1)));
    }

    /// @notice Per-student enumeration returns all their cert ids in order.
    function test_CertificatesOfStudent() public {
        vm.prank(issuer);
        certs.issueCertificate(42, "a", bytes32(uint256(1)));
        vm.prank(issuer);
        certs.issueCertificate(42, "b", bytes32(uint256(2)));
        vm.prank(issuer);
        certs.issueCertificate(9, "c", bytes32(uint256(3)));
        uint256[] memory list = certs.certificatesOfStudent(42);
        assertEq(list.length, 2);
        assertEq(list[0], 1);
        assertEq(list[1], 2);
    }

    /// @notice Deploying with the zero address reverts.
    function test_ConstructorRejectsZeroAdmin() public {
        vm.expectRevert(SchoolCertificates.BadParam.selector);
        new SchoolCertificates(address(0));
    }
}
