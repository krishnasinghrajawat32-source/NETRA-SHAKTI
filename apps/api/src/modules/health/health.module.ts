import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { StorageModule } from '../storage/storage.module';
import { LedgerModule } from '../ledger/ledger.module';
import { MLModule } from '../ml/ml.module';

@Module({
  imports: [StorageModule, LedgerModule, MLModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService]
})
export class HealthModule {}
