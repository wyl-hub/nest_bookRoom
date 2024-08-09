import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/registerUser.dto';
import { RedisService } from 'src/redis/redis.service';
import { EmailService } from 'src/email/email.service';
import { validateEmail } from 'src/utils';
import { LoginUserDto } from './dto/loginUser.dto';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { UpdateUserPasswordDto } from './dto/update-password.dto';
import { JwtUserData } from 'src/login.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListDto } from './dto/findList.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import uploadConfig from './config/uploadConfig';

@Controller('user')
export class UserController {
  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(EmailService)
  private emailService: EmailService;

  constructor(private readonly userService: UserService) {}
  // 登录
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto);
  }

  // 注册
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return await this.userService.register(registerUserDto);
  }

  // 查用户详情
  @Get('info')
  @RequireLogin()
  async getInfo(@UserInfo('id') id: number) {
    return this.userService.getInfo(id);
  }

  @Post('update_passoword')
  @RequireLogin()
  async updatePassword(
    @UserInfo() userInfo: JwtUserData,
    @Body() passwordDto: UpdateUserPasswordDto,
  ) {
    return this.userService.updatePassword(userInfo, passwordDto);
  }

  @Post('update')
  @RequireLogin()
  async update(@UserInfo('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto)
  }

  @Post('freeze')
  @RequireLogin()
  async freeze(@UserInfo('id') operatorId: number, @Body('id') id: number) {
    return await this.userService.freezeUserById(operatorId, id)
  }

  @Post('list')
  async list(@Body() listDto: ListDto) {
    return await this.userService.list(listDto)
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.userService.refresh(refreshToken);
  }

  // 发送注册验证码
  @Get('send_register_captcha')
  async sendCaptcha(@Query('email') email: string) {
    if (!validateEmail(email)) {
      throw new BadRequestException('请输入正确的邮箱');
    }

    // 判断距离上次获取验证码间隔是否已有一分钟
    const lastCaptcha = await this.redisService.get(`captcha${email}`)
    if (lastCaptcha) {
      throw new BadRequestException('请勿频繁获取验证码');
    }
    // 生成随机验证码
    const code = Math.random().toString().slice(2, 8);
    // 存入redis
    await this.redisService.set(`captcha${email}`, code, 60);

    // 发送邮件
    await this.emailService.sendMail({
      to: email,
      subject: '注册验证码',
      html: `<p>你的注册验证码是${code},有效时间1分钟</p>`,
    });

    return '发送成功';
  }

  // 直接给账户注册邮箱发送验证码
  @Get('send_private_captcha')
  @RequireLogin()
  async sendPrivateCaptcha(@UserInfo('email') email: string) {
    // 判断距离上次获取验证码间隔是否已有一分钟
    const lastCaptcha = await this.redisService.get(`captcha_private${email}`)
    if (lastCaptcha) {
      throw new BadRequestException('请勿频繁获取验证码');
    }

    // 生成随机验证码
    const code = Math.random().toString().slice(2, 8);
    // 存入redis
    await this.redisService.set(`captcha_private${email}`, code, 30);

    // 发送邮件
    await this.emailService.sendMail({
      to: email,
      subject: '验证码',
      html: `
      <p>你的验证码是${code},有效时间1分钟</p>
      <p style="color: red;">涉及账号隐私,请不要告诉他人</p>
      `,
    });

    return '已向该账户绑定邮箱发送验证码';
  }

  @Get('initData')
  async initData() {
    return this.userService.initData();
  }

  // 上传图片
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', uploadConfig))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      imgUrl: file.destination + '/' + file.filename,
      mimetype: file.mimetype,
      size: file.size
    }
  }

  @Get('aaa')
  aaa() {
    return 'aaa'
  }
}
