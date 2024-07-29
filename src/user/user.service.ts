import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from './dto/registerUser.dto';
import { RedisService } from 'src/redis/redis.service';
import { md5 } from 'src/utils';

@Injectable()
export class UserService {
  private logger = new Logger()

  @InjectRepository(User)
  private userRepository: Repository<User>

  @Inject(RedisService)
  private redisService: RedisService

  async register(user: RegisterUserDto) {
    // 根据注册的邮箱去 redis 中找到对应的验证码
    const captcha = await this.redisService.get(`captcha${user.email}`)

    if (!captcha) {
      throw new BadRequestException('验证码已失效')
    }

    if (user.captcha !== captcha) {
      throw new BadRequestException('验证码不正确')
    }

    const foundUser = await this.userRepository.findOneBy({
      username: user.username
    })

    if (foundUser) {
      throw new BadRequestException('用户名已存在')
    }

    // 验证码失效
    this.redisService.delKey(`captcha${user.email}`)

    const newUser = new User()
    newUser.username = user.username
    newUser.nickName = user.nickName
    // 密码加密存储
    newUser.password = md5(user.password)
    newUser.email = user.email

    try {
      await this.userRepository.save(newUser)
      return '注册成功'
    } catch(e) {
      this.logger.error(e, UserService)
      return '注册失败'
    }
  }
}
