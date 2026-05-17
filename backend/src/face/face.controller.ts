import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { FaceService } from './face.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('face')
export class FaceController {
  constructor(private faceService: FaceService) {}

  @UseGuards(JwtAuthGuard)
  @Post('register')
  async registerFace(@Request() req, @Body() body: { embedding: number[] }) {
    return this.faceService.registerFace(req.user.sub, body.embedding);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verifyFace(@Request() req, @Body() body: { embedding: number[] }) {
    return this.faceService.verifyFace(req.user.sub, body.embedding);
  }
}
