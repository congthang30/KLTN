import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto, VerifyWalletDto, VerifyFaceDto } from './dto/create-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ============================================================
  // BOOTSTRAP: Create first Admin account (one-time, no JWT needed)
  // ============================================================
  
  /**
   * Bootstrap the first Admin account.
   * Requires SUPER_ADMIN_PRIVATE_KEY for authorization.
   * Only works when zero Admin accounts exist in the system.
   */
  @Post('bootstrap')
  async bootstrapFirstAdmin(
    @Body() body: { username: string; email: string; superAdminSecret: string },
  ) {
    return this.authService.bootstrapFirstAdmin(
      body.username,
      body.email,
      body.superAdminSecret,
    );
  }

  // ============================================================
  // ADMIN: Wallet-based authentication (no password)
  // ============================================================

  /**
   * Step 1: Get challenge nonce for wallet address
   * Also verifies wallet is authorized on-chain (anti-hacker)
   */
  @Get('wallet-challenge/:address')
  async walletChallenge(@Param('address') address: string) {
    return this.authService.walletChallenge(address);
  }

  /**
   * Step 2: Submit signed nonce to login
   */
  @Post('wallet-login')
  async walletLogin(@Body() body: { walletAddress: string; signature: string; message: string }) {
    return this.authService.walletLogin(body.walletAddress, body.signature, body.message);
  }

  /**
   * Admin first-time: Login with invite token (no password)
   */
  @Post('invite-login')
  async inviteLogin(@Body() body: { inviteToken: string }) {
    return this.authService.loginWithInviteToken(body.inviteToken);
  }

  // ============================================================
  // DOCTOR: Traditional username/password login
  // ============================================================
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  // ============================================================
  // SHARED: Post-login verification & Wallet Recovery
  // ============================================================

  /**
   * Public endpoint to verify face against username for wallet recovery.
   * Returns a temporary access token for ZKP recovery page.
   */
  @Post('recover-init')
  async recoverInit(@Body() body: { embedding: number[] }) {
    return this.authService.recoverInit(body.embedding);
  }

  /**
   * Public endpoint to verify face against doctor profiles for password recovery.
   * Returns a temporary access token for Reset Password page.
   */
  @Post('doctor-recover-init')
  async doctorRecoverInit(@Body() body: { embedding: number[] }) {
    return this.authService.doctorRecoverInit(body.embedding);
  }

  /**
   * Reset password using temporary reset token
   */
  @UseGuards(JwtAuthGuard)
  @Post('reset-password')
  async resetPassword(@Request() req, @Body() body: { newPassword: string }) {
    return this.authService.resetPassword(req.user.sub, body.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-wallet')
  async verifyWallet(@Request() req, @Body() dto: VerifyWalletDto) {
    return this.authService.verifyWallet(req.user.sub, dto.address, dto.signature, dto.message);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-face')
  async verifyFace(@Request() req, @Body() dto: VerifyFaceDto) {
    return this.authService.verifyFace(req.user.sub, dto.embedding);
  }

  // ============================================================
  // DOCTOR ONLY: Password management
  // ============================================================

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, dto.oldPassword, dto.newPassword);
  }

  // ============================================================
  // ADMIN ONLY: MFA secret for wallet recovery
  // ============================================================

  @UseGuards(JwtAuthGuard)
  @Post('generate-secret')
  async generateMfaSecret(@Request() req) {
    return this.authService.generateMfaSecret(req.user.sub);
  }
}
