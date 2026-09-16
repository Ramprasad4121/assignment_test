/**
 * @fileoverview ABI of SchoolCertificates (generated from forge build output).
 * Do not hand-edit; regenerate from blockchain/out after recompiling.
 */
export const CERTIFICATE_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_admin",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "admin",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "certificatesOfStudent",
    "inputs": [
      {
        "name": "studentId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "certIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCertificate",
    "inputs": [
      {
        "name": "certId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "cert",
        "type": "tuple",
        "internalType": "struct SchoolCertificates.Certificate",
        "components": [
          {
            "name": "studentId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "issuer",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "issuedAt",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "revoked",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "metadataCID",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "achievementHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isIssuer",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "allowed",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "issueCertificate",
    "inputs": [
      {
        "name": "studentId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "metadataCID",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "achievementHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "certId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "nextCertId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "revokeCertificate",
    "inputs": [
      {
        "name": "certId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setIssuer",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "allowed",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferAdmin",
    "inputs": [
      {
        "name": "newAdmin",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "verifyCertificate",
    "inputs": [
      {
        "name": "certId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "valid",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "studentId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "issuer",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "issuedAt",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "metadataCID",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "achievementHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "CertificateIssued",
    "inputs": [
      {
        "name": "certId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "studentId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "issuer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "metadataCID",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "achievementHash",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CertificateRevoked",
    "inputs": [
      {
        "name": "certId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "revokedBy",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "IssuerUpdated",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "allowed",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AlreadyRevoked",
    "inputs": [
      {
        "name": "certId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "BadParam",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CertNotFound",
    "inputs": [
      {
        "name": "certId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "NotAdmin",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotIssuer",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotRevoker",
    "inputs": []
  }
] as const;
