import { Controller, Post, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { EmailService } from '../email/email.service';

@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private emailService: EmailService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('create')
  async createUser(@Body() dto: CreateUserDto) {
    const result = await this.userService.createUser(dto.username, dto.email, dto.role);

    // Send credentials via email
    await this.emailService.sendCredentials(dto.email, dto.username, result.tempPassword);

    return {
      message: 'User created successfully. Credentials sent via email.',
      user: result.user,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('all')
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    return this.userService.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateProfile(@Request() req, @Body() body: { walletAddress?: string }) {
    if (body.walletAddress) {
      await this.userService.updateWalletAddress(req.user.sub, body.walletAddress);
    }
    return this.userService.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('rollback')
  async rollbackStep(@Request() req, @Body() body: { currentStep: number }) {
    const result = await this.userService.rollbackStep(req.user.sub, body.currentStep);
    return {
      message: `Successfully rolled back to step ${result.registrationStep}`,
      registrationStep: result.registrationStep,
    };
  }
}
