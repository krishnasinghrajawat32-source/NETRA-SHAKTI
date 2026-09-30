import { Module, Global } from '@nestjs/common';
import { WatermarkService } from './watermark.service';
import { WatermarkController } from './watermark.controller';

@Global()
@Module({
  controllers: [WatermarkController],
  providers: [WatermarkService],
  exports: [WatermarkService]
})
export class WatermarkModule {}
