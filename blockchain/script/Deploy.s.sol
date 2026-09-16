// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SchoolCertificates.sol";

/// @title DeploySchoolCertificates
/// @notice Deployment script: deploys {SchoolCertificates} with the sender as admin.
/// @dev Usage:
/// ```sh
/// forge script script/Deploy.s.sol --rpc-url <RPC> --private-key <KEY> --broadcast
/// ```
contract DeploySchoolCertificates is Script {
    /// @notice Broadcasts the deployment; logs the new contract address.
    function run() external returns (SchoolCertificates deployed) {
        vm.startBroadcast();
        deployed = new SchoolCertificates(msg.sender);
        vm.stopBroadcast();
        console.log("SchoolCertificates deployed at:", address(deployed));
    }
}
