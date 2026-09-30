import { Module, Global } from '@nestjs/common';
import { MLService } from './ml.service';
import { MLController } from './ml.controller';

@Global()
@Module({
  controllers: [MLController],
  providers: [MLService],
  exports: [MLService]
})
export class MLModule {}
