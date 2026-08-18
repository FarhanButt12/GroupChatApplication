import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EditMessageDto {
  @ApiProperty({ description: 'Updated message content', example: 'Updated hello world!' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
