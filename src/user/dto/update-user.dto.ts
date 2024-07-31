import { IsNotEmpty } from "class-validator";

export class UpdateUserDto {
    @IsNotEmpty({
      message: '头像不能为空'
    })
    headPic: string;
    
    @IsNotEmpty({
      message: '昵称不能为空'
    })
    nickName: string;
}