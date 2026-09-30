import { Module } from '@nestjs/common';
import { DecryptionService } from './decryption.service';
import { DecryptionController } from './decryption.controller';

@Module({
  controllers: [DecryptionController],
  providers: [DecryptionService],
  exports: [DecryptionService]
})
export class DecryptionModule {}
