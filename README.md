## typeORM mysql 相关依赖

pnpm install --save @nestjs/typeorm typeorm mysql2
app.module imports 添加 typeOrm

```
TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'wyl99001213',
      database: 'meeting_room',
      synchronize: true,
      logging: true,
      entities: [],
      poolSize: 10,
      connectorPackage: 'mysql2',
      extra: {
        authPlugin: 'sha256_password'
      }
    })
```

## 请求体校验 dto vo ...

pnpm install --save class-validator class-transformer

main.ts
app.useGlobalPipes(new ValidationPipe())

## redis 模块

pnpm install --save redis
nest g module redis
nest g service redis

@Global() reids 模块全局引入 需要的模块直接 inject

```
@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      async useFactory() {
        const client = createClient({
          socket: {
            host: 'localhost',
            port: 6379,
          },
          database: 1,
        });
        await client.connect();
        return client;
      },
    },
  ],
  exports: [RedisService]
})
export class RedisModule {}
```

## 邮箱验证码
nest g resource email
发送邮件的包
pnpm install nodemailer --save

## 配置抽离
pnpm install --save @nestjs/config

appModule 引入
``` 
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'src/.env'
    }),
```

## jwt 模块

pnpm install --save @nestjs/jwt

## 守卫鉴权

nest g guard login --flat --no-spec
nest g guard permission --flat --no-spec

## 响应内容的拦截器 规范响应格式
nest g interceptor format-response --flat

## 接口访问记录
nest g interceptor invoke-record --flat

## 错误响应格式化
nest g filter custom-exception --flat