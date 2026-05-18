const { expect } = require("chai");
const hre = require("hardhat");

describe("IdentityRegistry", function () {
  let registry, mockVerifier, admin, user1, user2;

  beforeEach(async function () {
    [admin, user1, user2] = await hre.ethers.getSigners();

    // Deploy MockVerifier
    const MockVerifier = await hre.ethers.getContractFactory("MockVerifier");
    mockVerifier = await MockVerifier.deploy();
    await mockVerifier.waitForDeployment();

    // Deploy IdentityRegistry
    const IdentityRegistry = await hre.ethers.getContractFactory("IdentityRegistry");
    registry = await IdentityRegistry.deploy(await mockVerifier.getAddress());
    await registry.waitForDeployment();
  });

  describe("Registration", function () {
    it("should register a new identity", async function () {
      const commitment = 12345n;
      await expect(registry.connect(user1).registerIdentity(commitment))
        .to.emit(registry, "IdentityRegistered")
        .withArgs(commitment, user1.address);

      const [walletAddress, isActive] = await registry.getIdentity(commitment);
      expect(walletAddress).to.equal(user1.address);
      expect(isActive).to.be.true;
    });

    it("should reject duplicate commitment", async function () {
      const commitment = 12345n;
      await registry.connect(user1).registerIdentity(commitment);
      await expect(
        registry.connect(user2).registerIdentity(commitment)
      ).to.be.revertedWith("IdentityRegistry: commitment already registered");
    });

    it("should reject duplicate address", async function () {
      await registry.connect(user1).registerIdentity(11111n);
      await expect(
        registry.connect(user1).registerIdentity(22222n)
      ).to.be.revertedWith("IdentityRegistry: address already has identity");
    });

    it("should reject zero commitment", async function () {
      await expect(
        registry.connect(user1).registerIdentity(0n)
      ).to.be.revertedWith("IdentityRegistry: zero commitment");
    });
  });

  describe("Authorization", function () {
    it("should return true for registered address", async function () {
      await registry.connect(user1).registerIdentity(12345n);
      expect(await registry.isAuthorized(user1.address)).to.be.true;
    });

    it("should return false for unregistered address", async function () {
      expect(await registry.isAuthorized(user2.address)).to.be.false;
    });
  });

  describe("Wallet Recovery", function () {
    it("should recover wallet with valid proof (mock)", async function () {
      const commitment = 12345n;
      await registry.connect(user1).registerIdentity(commitment);

      // Mock proof values (MockVerifier always returns true)
      const pA = [0n, 0n];
      const pB = [[0n, 0n], [0n, 0n]];
      const pC = [0n, 0n];

      await expect(
        registry.connect(user2).recoverWallet(pA, pB, pC, commitment, user2.address)
      )
        .to.emit(registry, "WalletRecovered")
        .withArgs(commitment, user1.address, user2.address);

      // Verify updated mappings
      const [newAddr, isActive] = await registry.getIdentity(commitment);
      expect(newAddr).to.equal(user2.address);
      expect(isActive).to.be.true;
      expect(await registry.isAuthorized(user1.address)).to.be.false;
      expect(await registry.isAuthorized(user2.address)).to.be.true;
    });

    it("should reject recovery to address with existing identity", async function () {
      await registry.connect(user1).registerIdentity(11111n);
      await registry.connect(user2).registerIdentity(22222n);

      const pA = [0n, 0n];
      const pB = [[0n, 0n], [0n, 0n]];
      const pC = [0n, 0n];

      await expect(
        registry.connect(admin).recoverWallet(pA, pB, pC, 11111n, user2.address)
      ).to.be.revertedWith("IdentityRegistry: new address already has identity");
    });
  });

  describe("Admin Functions", function () {
    it("should revoke identity", async function () {
      const commitment = 12345n;
      await registry.connect(user1).registerIdentity(commitment);

      await expect(registry.connect(admin).revokeIdentity(commitment))
        .to.emit(registry, "IdentityRevoked")
        .withArgs(commitment);

      const [, isActive] = await registry.getIdentity(commitment);
      expect(isActive).to.be.false;
    });

    it("should reject revoke from non-admin", async function () {
      await registry.connect(user1).registerIdentity(12345n);
      await expect(
        registry.connect(user1).revokeIdentity(12345n)
      ).to.be.revertedWith("IdentityRegistry: caller is not admin");
    });

    it("should allow admin to update wallet address", async function () {
      const commitment = 12345n;
      await registry.connect(user1).registerIdentity(commitment);

      await expect(registry.connect(admin).updateAdminWallet(commitment, user2.address))
        .to.emit(registry, "WalletRecovered")
        .withArgs(commitment, user1.address, user2.address);

      const [newAddr, isActive] = await registry.getIdentity(commitment);
      expect(newAddr).to.equal(user2.address);
      expect(isActive).to.be.true;
      expect(await registry.isAuthorized(user1.address)).to.be.false;
      expect(await registry.isAuthorized(user2.address)).to.be.true;
    });

    it("should reject updateAdminWallet from non-admin", async function () {
      const commitment = 12345n;
      await registry.connect(user1).registerIdentity(commitment);
      
      await expect(
        registry.connect(user2).updateAdminWallet(commitment, user2.address)
      ).to.be.revertedWith("IdentityRegistry: caller is not admin");
    });

    it("should update verifier", async function () {
      const MockVerifier2 = await hre.ethers.getContractFactory("MockVerifier");
      const newVerifier = await MockVerifier2.deploy();
      await newVerifier.waitForDeployment();

      await expect(registry.connect(admin).updateVerifier(await newVerifier.getAddress()))
        .to.emit(registry, "VerifierUpdated");
    });
  });
});
