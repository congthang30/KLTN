import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto, VerifyWalletDto, VerifyFaceDto } from './dto/create-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, dto.oldPassword, dto.newPassword);
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

  @UseGuards(JwtAuthGuard)
  @Post('generate-secret')
  async generateSecret(@Request() req) {
    return this.authService.generateSecret(req.user.sub);
  }
}
