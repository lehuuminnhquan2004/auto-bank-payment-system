import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  @Matches(/^[1-9]\d*$/)
  @MaxLength(19)
  productId: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  @IsUUID('4')
  checkoutKey: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ArrayUnique(
    (item: CreateOrderItemDto) =>
      item.productId,
  )
  @ValidateNested({
    each: true,
  })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}