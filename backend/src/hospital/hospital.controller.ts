import { Controller, Get, UseGuards } from '@nestjs/common';
import { HospitalService } from './hospital.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('hospital')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Get('doctors')
  async getDoctors() {
    return this.hospitalService.getDoctors();
  }

  @Get('diagnoses')
  async getDiagnoses() {
    return this.hospitalService.getDiagnoses();
  }

  @Get('transactions')
  async getTransactions() {
    return this.hospitalService.getBlockchainTransactions();
  }

  @Get('aimodels')
  async getAiModels() {
    return this.hospitalService.getAiModels();
  }
}
