import { Module } from '@nestjs/common';
import { ZkpService } from './zkp.service';
import { ZkpController } from './zkp.controller';
import { FaceModule } from '../face/face.module';
import { UserModule } from '../user/user.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [FaceModule, UserModule, BlockchainModule],
  controllers: [ZkpController],
  providers: [ZkpService],
  exports: [ZkpService],
})
export class ZkpModule {}
