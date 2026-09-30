import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { RecipientsModule } from './modules/recipients/recipients.module';
import { DecryptionModule } from './modules/decryption/decryption.module';
import { WatermarkModule } from './modules/watermark/watermark.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { InvestigationsModule } from './modules/investigations/investigations.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MLModule } from './modules/ml/ml.module';
import { CryptoModule } from './modules/crypto/crypto.module';
import { StorageModule } from './modules/storage/storage.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    StorageModule,
    AuditModule,
    CryptoModule,
    WatermarkModule,
    LedgerModule,
    MLModule,
    AuthModule,
    UsersModule,
    DocumentsModule,
    RecipientsModule,
    DecryptionModule,
    InvestigationsModule,
    ReportsModule,
    HealthModule,
    DashboardModule
  ]
})
export class AppModule {}
