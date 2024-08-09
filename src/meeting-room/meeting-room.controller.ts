import { Controller, Get } from '@nestjs/common';
import { Body, Param, Post } from '@nestjs/common';
import { MeetingRoomService } from './meeting-room.service';
import { ListDto } from './dto/findList.dto';
import { CreateMeetingRoomDto } from './dto/create-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-room.dto';

@Controller('meeting-room')
export class MeetingRoomController {
  constructor(private readonly meetingRoomService: MeetingRoomService) {}

  @Get('aaa')
  aaa() {
    return 'aaa';
  }

  @Post('create')
  async create(@Body() createMeetingRoomDto: CreateMeetingRoomDto) {
    return await this.meetingRoomService.create(createMeetingRoomDto);
  }

  @Post('update')
  async update(@Body() updateMeetingRoomDto: UpdateMeetingRoomDto) {
    return await this.meetingRoomService.update(updateMeetingRoomDto);
  }

  @Post('list')
  async list(@Body() listDto: ListDto) {
    return await this.meetingRoomService.list(listDto);
  }

  @Post('delete')
  async delete(@Body('id') id: number) {
    return this.meetingRoomService.delete(id);
  }

  @Get(':id')
  async find(@Param('id') id: number) {
    return this.meetingRoomService.findById(id);
  }
}
