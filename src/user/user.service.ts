import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from './dto/registerUser.dto';
import { RedisService } from 'src/redis/redis.service';
import { md5 } from 'src/utils';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { LoginUserDto } from './dto/loginUser.dto';
import { LoginUserVo } from './vo/loginUser.vo';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserPasswordDto } from './dto/update-password.dto';
import { JwtUserData } from 'src/login.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListDto } from './dto/findList.dto';

@Injectable()
export class UserService {
  private logger = new Logger();

  @Inject(ConfigService)
  configService: ConfigService;

  @Inject(JwtService)
  jwtService: JwtService;

  @InjectRepository(User)
  private userRepository: Repository<User>;

  @InjectRepository(Role)
  private roleRepository: Repository<Role>;

  @InjectRepository(Permission)
  private permissionRepository: Repository<Permission>;

  @Inject(RedisService)
  private redisService: RedisService;

  async login(user: LoginUserDto) {
    const foundUser = await this.userRepository.findOne({
      where: {
        username: user.username,
        password: md5(user.password),
      },
      relations: ['roles', 'roles.permissions'],
    });

    if (!foundUser) {
      throw new BadRequestException('用户名或密码错误');
    }

    return this.disposeLoginVo(foundUser);
  }

  async register(user: RegisterUserDto) {
    // 根据注册的邮箱去 redis 中找到对应的验证码
    const captcha = await this.redisService.get(`captcha${user.email}`);

    if (!captcha) {
      throw new BadRequestException('验证码已失效');
    }

    if (user.captcha !== captcha) {
      throw new BadRequestException('验证码不正确');
    }

    const foundUser = await this.userRepository.findOneBy({
      username: user.username,
    });

    if (foundUser) {
      throw new BadRequestException('用户名已存在');
    }

    // 验证码失效
    this.redisService.delKey(`captcha${user.email}`);

    const newUser = new User();
    newUser.username = user.username;
    newUser.nickName = user.nickName;
    // 密码加密存储
    newUser.password = md5(user.password);
    newUser.email = user.email;

    try {
      await this.userRepository.save(newUser);
      return '注册成功';
    } catch (e) {
      this.logger.error(e, UserService);
      return '注册失败';
    }
  }

  async getInfo(id: number) {
    const user = await this.userRepository.findOneBy({
      id,
    });
    delete user.password;
    return user;
  }

  async updatePassword(
    userInfo: JwtUserData,
    updatePassword: UpdateUserPasswordDto,
  ) {
    const captcha = await this.redisService.get(
      `captcha_private${userInfo.email}`,
    );

    if (!captcha) {
      throw new BadRequestException('验证码已失效');
    }

    if (updatePassword.captcha !== captcha) {
      throw new BadRequestException('验证码不正确');
    }

    const foundUser = await this.userRepository.findOneBy({ id: userInfo.id });
    foundUser.password = md5(updatePassword.password)
    
    try {
      await this.userRepository.save(foundUser)
      return '密码修改成功'
    } catch(e) {
      this.logger.error(e, UserService)
      return '密码修改失败'
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const foundUser = await this.userRepository.findOneBy({ id })
    foundUser.headPic = updateUserDto.headPic
    foundUser.nickName = updateUserDto.nickName

    try {
      await this.userRepository.save(foundUser)
      return '用户信息修改成功'
    } catch(e) {
      this.logger.error(e, UserService)
      return '用户信息修改失败'
    }
  }

  async list(listDto: ListDto) {
    const [list, totalCount] = await this.userRepository.findAndCount({
      skip: (listDto.pageNo - 1) * listDto.pageSize,
      take: listDto.pageSize
    })
    
    list.forEach(item => {
      delete item.password
    })

    return {
      list,
      totalCount
    }
  }

  async freezeUserById(operatorId: number, id: number) {
    const operator = await this.userRepository.findOneBy({ id: operatorId })
    if (!operator.isAdmin) {
      throw new BadRequestException('当前用户无冻结账户权限')
    }
    const foundUser = await this.userRepository.findOneBy({ id })
    foundUser.isFrozen = true
    
    try {
      await this.userRepository.save(foundUser)
      return '冻结成功'
    } catch(e) {
      this.logger.error(e, UserService)
      return '冻结失败'
    }
  }

  async refresh(refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({
        where: {
          id: data.id,
        },
        relations: ['roles', 'roles.permissions'],
      });
      return this.disposeLoginVo(user);
    } catch (e) {
      throw new UnauthorizedException('token已失效,请重新登录');
    }
  }

  async initData() {
    const user1 = new User();
    user1.username = 'admin';
    user1.password = md5('admin');
    user1.email = 'xxx@xx.com';
    user1.isAdmin = true;
    user1.nickName = 'admin';
    user1.phoneNumber = '13233323333';

    const user2 = new User();
    user2.username = 'lisi';
    user2.password = md5('222222');
    user2.email = 'yy@yy.com';
    user2.nickName = '李四';

    const role1 = new Role();
    role1.name = '管理员';

    const role2 = new Role();
    role2.name = '普通用户';

    const permission1 = new Permission();
    permission1.code = 'ccc';
    permission1.description = '访问 ccc 接口';

    const permission2 = new Permission();
    permission2.code = 'ddd';
    permission2.description = '访问 ddd 接口';

    user1.roles = [role1];
    user2.roles = [role2];

    role1.permissions = [permission1, permission2];
    role2.permissions = [permission1];

    await this.permissionRepository.save([permission1, permission2]);
    await this.roleRepository.save([role1, role2]);
    await this.userRepository.save([user1, user2]);
  }

  async disposeLoginVo(user: User) {
    const loginUserVo = new LoginUserVo();
    const permissionId: number[] = [];
    loginUserVo.userInfo = {
      id: user.id,
      username: user.username,
      nickName: user.nickName,
      email: user.email,
      headPic: user.headPic,
      phoneNumber: user.phoneNumber,
      isFrozen: user.isFrozen,
      isAdmin: user.isAdmin,
      createTime: user.createTime,
      roles: user.roles.map((item) => item.name),
      permissions: user.roles.reduce((arr, item) => {
        item.permissions.forEach((permission) => {
          if (permissionId.indexOf(permission.id) === -1) {
            permissionId.push(permission.id);
            arr.push(permission);
          }
        });
        return arr;
      }, []),
    };
    loginUserVo.accessToken = this.jwtService.sign(
      {
        id: loginUserVo.userInfo.id,
        username: loginUserVo.userInfo.username,
        email: loginUserVo.userInfo.email,
        roles: loginUserVo.userInfo.roles,
        permissions: loginUserVo.userInfo.permissions,
      },
      {
        expiresIn:
          this.configService.get('jwt_access_token_expires_time') || '30m',
      },
    );
    loginUserVo.refreshToken = this.jwtService.sign(
      {
        id: loginUserVo.userInfo.id,
      },
      {
        expiresIn:
          this.configService.get('jwt_refresh_token_expres_time') || '7d',
      },
    );
    return loginUserVo;
  }
}
