import { Body, Controller, Get, Post } from '@nestjs/common';
import { BookingService } from './booking.service';
import { ListDto } from './dto/findList.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('list')
  async list(@Body() listDto: ListDto) {
    return await this.bookingService.list(listDto);
  }

  @Get('initData')
  async initData() {
    return await this.bookingService.initData()
  }
}
