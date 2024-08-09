import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MeetingRoom } from './entities/meeting-room.entity';
import { Like, Repository } from 'typeorm';
import { ListDto } from './dto/findList.dto';
import { CreateMeetingRoomDto } from './dto/create-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-room.dto';

@Injectable()
export class MeetingRoomService {
  @InjectRepository(MeetingRoom)
  private meetingRoomRepository: Repository<MeetingRoom>;

  async list(listDto: ListDto) {
    const condition: Record<string, any> = {};

    if (listDto.name) {
      condition.name = Like(`%${listDto.name}%`);
    }

    if (listDto.capacity) {
      condition.capacity = Like(`%${listDto.capacity}%`);
    }

    if (listDto.equipment) {
      condition.equipment = Like(`%${listDto.equipment}%`);
    }

    const [list, totalCount] = await this.meetingRoomRepository.findAndCount({
      skip: (listDto.pageNo - 1) * listDto.pageSize,
      take: listDto.pageSize,
      where: condition,
    });

    return {
      list,
      totalCount,
    };
  }

  async create(createMeetingRoomDto: CreateMeetingRoomDto) {
    const foundRoom = await this.meetingRoomRepository.findOneBy({
      name: createMeetingRoomDto.name,
    });

    if (foundRoom) {
      throw new BadRequestException('会议室名称已存在');
    }

    try {
      await this.meetingRoomRepository.insert(createMeetingRoomDto);
      return '创建成功';
    } catch (e) {
      return '创建失败';
    }
  }

  async update(updateMeetingRoomDto: UpdateMeetingRoomDto) {
    const foundRoom = await this.meetingRoomRepository.findOneBy({
      id: updateMeetingRoomDto.id,
    });

    if (!foundRoom) {
      throw new BadRequestException('会议室不存在！');
    }

    foundRoom.name = updateMeetingRoomDto.name;
    foundRoom.location = updateMeetingRoomDto.location;
    foundRoom.equipment = updateMeetingRoomDto.equipment;
    foundRoom.description = updateMeetingRoomDto.description;
    foundRoom.capacity = updateMeetingRoomDto.capacity;

    try {
      await this.meetingRoomRepository.update(
        {
          id: foundRoom.id,
        },
        foundRoom,
      );
      return '修改信息成功';
    } catch (e) {
      return '修改失败';
    }
  }

  async findById(id: number) {
    const foundMeet = await this.meetingRoomRepository.findOneBy({ id });
    if (!foundMeet) {
      throw new BadRequestException('查询失败');
    }
    return foundMeet;
  }

  async delete(id: number) {
    try {
      await this.meetingRoomRepository.delete(id);
      return '删除成功';
    } catch (e) {
      return '删除失败';
    }
  }

  initData() {
    const room1 = new MeetingRoom();
    room1.name = '木星';
    room1.capacity = 10;
    room1.equipment = '白板';
    room1.location = '一层西';

    const room2 = new MeetingRoom();
    room2.name = '金星';
    room2.capacity = 5;
    room2.equipment = '';
    room2.location = '二层东';

    const room3 = new MeetingRoom();
    room3.name = '天王星';
    room3.capacity = 30;
    room3.equipment = '白板，电视';
    room3.location = '三层东';

    try {
      this.meetingRoomRepository.save([room1, room2, room3]);
      return '初始化';
    } catch (e) {
      return '错误';
    }
  }
}
