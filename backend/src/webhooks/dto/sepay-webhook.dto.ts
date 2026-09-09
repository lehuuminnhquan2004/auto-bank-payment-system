import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SePayWebhookDto {
  @IsInt()
  @Min(1)
  id: number;

  @IsString()
  gateway: string;

  @IsString()
  transactionDate: string;

  @IsString()
  accountNumber: string;

  @IsOptional()
  @IsString()
  subAccount?: string;

  @IsOptional()
  @IsString()
  code?: string | null;

  @IsString()
  content: string;

  @IsIn(['in', 'out'])
  transferType: 'in' | 'out';

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  transferAmount: number;

  @IsInt()
  @Min(0)
  accumulated: number;

  @IsOptional()
  @IsString()
  referenceCode?: string;
}