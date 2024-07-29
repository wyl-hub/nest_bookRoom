import { BadRequestException, Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/registerUser.dto';
import { RedisService } from 'src/redis/redis.service';
import { EmailService } from 'src/email/email.service';
import { validateEmail } from 'src/utils';

@Controller('user')
export class UserController {
  @Inject(RedisService)
  private redisService: RedisService

  @Inject(EmailService)
  private emailService: EmailService

  constructor(private readonly userService: UserService) {}

  // 注册
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return await this.userService.register(registerUserDto)
  }

  // 发送验证码
  @Get('send_register_captcha')
  async sendCaptcha(@Query('email') email: string) {
    if (!validateEmail(email)) {
      throw new BadRequestException('请输入正确的邮箱')
    }
    // 生成随机验证码
    const code = Math.random().toString().slice(2, 8)
    // 存入redis
    await this.redisService.set(`captcha${email}`, code)

    // 发送邮件
    await this.emailService.sendMail({
      to: email,
      subject: '注册验证码',
      html: `<p>你的注册验证码是${code}</p>`
    })

    return '发送成功'
  }
}
