import { Injectable } from '@nestjs/common';
import { ListDto } from './dto/findList.dto';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { Between, EntityManager, Like, Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { MeetingRoom } from 'src/meeting-room/entities/meeting-room.entity';

@Injectable()
export class BookingService {
  @InjectEntityManager()
  private entityManager: EntityManager;

  @InjectRepository(Booking)
  private bookingRepository: Repository<Booking>;

  async list(listDto: ListDto) {
    const condition: Record<string, any> = {};
    if (listDto.username) {
      condition.user = {
        username: Like(`%${listDto.username}%`),
      };
    }
    if (listDto.meetingRoomName || listDto.meetingRoomPosition) {
      condition.room = {};
      if (listDto.meetingRoomName) {
        condition.room.name = Like(`%${listDto.meetingRoomName}%`);
      }
      if (listDto.meetingRoomPosition) {
        condition.room.location = Like(`%${listDto.meetingRoomPosition}%`);
      }
    }
    if (listDto.bookingTimeRangeStart && listDto.bookingTimeRangeEnd) {
      condition.startTime = Between(
        new Date(listDto.bookingTimeRangeStart),
        new Date(listDto.bookingTimeRangeEnd),
      );
    }

    const [list, totalCount] = await this.bookingRepository.findAndCount({
      skip: (listDto.pageNo - 1) * listDto.pageSize,
      take: listDto.pageSize,
      where: condition,
      relations: {
        user: true,
        room: true,
      },
    });

    return {
      list: list.map(item => {
        delete item.user.password
        return item
      }),
      totalCount,
    };
  }

  async initData() {
    const user1 = await this.entityManager.findOneBy(User, {
      id: 1,
    });
    const user2 = await this.entityManager.findOneBy(User, {
      id: 2,
    });

    const room1 = await this.entityManager.findOneBy(MeetingRoom, {
      id: 3,
    });
    const room2 = await this.entityManager.findOneBy(MeetingRoom, {
      id: 6,
    });

    const booking1 = new Booking();
    booking1.room = room1;
    booking1.user = user1;
    booking1.startTime = new Date();
    booking1.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking1);

    const booking2 = new Booking();
    booking2.room = room2;
    booking2.user = user2;
    booking2.startTime = new Date();
    booking2.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking2);

    const booking3 = new Booking();
    booking3.room = room1;
    booking3.user = user2;
    booking3.startTime = new Date();
    booking3.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking3);

    const booking4 = new Booking();
    booking4.room = room2;
    booking4.user = user1;
    booking4.startTime = new Date();
    booking4.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking4);

    return '初始化成功';
  }
}
