// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVerifier
 * @notice Interface for Groth16 ZKP verifier
 */
interface IVerifier {
    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[1] calldata _pubSignals
    ) external view returns (bool);
}

/**
 * @title IdentityRegistry
 * @notice Manages user identities with ZKP-based verification and wallet recovery
 * @dev Uses Poseidon hash commitments: commitment = Poseidon(secret, faceHash)
 */
contract IdentityRegistry {
    IVerifier public verifier;
    address public admin;

    struct Identity {
        address walletAddress;
        bool isActive;
        uint256 registeredAt;
    }

    // commitment => Identity
    mapping(uint256 => Identity) public identities;
    // address => commitment
    mapping(address => uint256) public addressToCommitment;

    event IdentityRegistered(uint256 indexed commitment, address indexed walletAddress);
    event WalletRecovered(uint256 indexed commitment, address indexed oldAddress, address indexed newAddress);
    event IdentityRevoked(uint256 indexed commitment);
    event VerifierUpdated(address indexed newVerifier);

    modifier onlyAdmin() {
        require(msg.sender == admin, "IdentityRegistry: caller is not admin");
        _;
    }

    constructor(address _verifier) {
        require(_verifier != address(0), "IdentityRegistry: zero verifier address");
        verifier = IVerifier(_verifier);
        admin = msg.sender;
    }

    /**
     * @notice Register a new identity with a ZKP commitment
     * @param _commitment Poseidon(secret, faceHash) - stored publicly on-chain
     */
    function registerIdentity(uint256 _commitment) external {
        require(_commitment != 0, "IdentityRegistry: zero commitment");
        require(
            identities[_commitment].walletAddress == address(0),
            "IdentityRegistry: commitment already registered"
        );
        require(
            addressToCommitment[msg.sender] == 0,
            "IdentityRegistry: address already has identity"
        );

        identities[_commitment] = Identity({
            walletAddress: msg.sender,
            isActive: true,
            registeredAt: block.timestamp
        });

        addressToCommitment[msg.sender] = _commitment;

        emit IdentityRegistered(_commitment, msg.sender);
    }

    /**
     * @notice Recover wallet by proving identity via ZKP
     * @dev Verifies Groth16 proof that caller knows (secret, faceHash) for the commitment
     * @param _pA Proof point A
     * @param _pB Proof point B
     * @param _pC Proof point C
     * @param _commitment The public commitment (must match on-chain record)
     * @param _newAddress The new wallet address to assign
     */
    function recoverWallet(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint256 _commitment,
        address _newAddress
    ) external {
        require(identities[_commitment].isActive, "IdentityRegistry: identity not active");
        require(_newAddress != address(0), "IdentityRegistry: zero new address");
        require(
            addressToCommitment[_newAddress] == 0,
            "IdentityRegistry: new address already has identity"
        );

        // Verify ZKP proof on-chain
        uint[1] memory pubSignals = [_commitment];
        require(
            verifier.verifyProof(_pA, _pB, _pC, pubSignals),
            "IdentityRegistry: invalid ZKP proof"
        );

        address oldAddress = identities[_commitment].walletAddress;

        // Update mappings
        delete addressToCommitment[oldAddress];
        identities[_commitment].walletAddress = _newAddress;
        addressToCommitment[_newAddress] = _commitment;

        emit WalletRecovered(_commitment, oldAddress, _newAddress);
    }

    /**
     * @notice Super Admin (Backend Relayer): update wallet address for an identity
     * @dev Used when an Admin loses their wallet and recovers via MFA on the backend
     */
    function updateAdminWallet(uint256 _commitment, address _newAddress) external onlyAdmin {
        require(identities[_commitment].isActive, "IdentityRegistry: identity not active");
        require(_newAddress != address(0), "IdentityRegistry: zero new address");
        require(
            addressToCommitment[_newAddress] == 0,
            "IdentityRegistry: new address already has identity"
        );

        address oldAddress = identities[_commitment].walletAddress;

        // Update mappings
        delete addressToCommitment[oldAddress];
        identities[_commitment].walletAddress = _newAddress;
        addressToCommitment[_newAddress] = _commitment;

        emit WalletRecovered(_commitment, oldAddress, _newAddress);
    }

    /**
     * @notice Check if an address is authorized (has active identity)
     */
    function isAuthorized(address _addr) external view returns (bool) {
        uint256 commitment = addressToCommitment[_addr];
        if (commitment == 0) return false;
        return identities[commitment].isActive;
    }

    /**
     * @notice Get identity details by commitment
     */
    function getIdentity(uint256 _commitment)
        external
        view
        returns (address walletAddress, bool isActive, uint256 registeredAt)
    {
        Identity memory id = identities[_commitment];
        return (id.walletAddress, id.isActive, id.registeredAt);
    }

    /**
     * @notice Admin: revoke an identity
     */
    function revokeIdentity(uint256 _commitment) external onlyAdmin {
        require(identities[_commitment].isActive, "IdentityRegistry: not active");
        identities[_commitment].isActive = false;
        emit IdentityRevoked(_commitment);
    }

    /**
     * @notice Admin: update verifier contract (e.g., after recompiling circuit)
     */
    function updateVerifier(address _newVerifier) external onlyAdmin {
        require(_newVerifier != address(0), "IdentityRegistry: zero address");
        verifier = IVerifier(_newVerifier);
        emit VerifierUpdated(_newVerifier);
    }
}
