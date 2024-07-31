import { IsNotEmpty } from "class-validator";

export class ListDto {
    @IsNotEmpty({
      message: '页码不能为空'
    })
    pageNo: number;
    
    @IsNotEmpty({
      message: '每页数量不能为空'
    })
    pageSize: number;
}