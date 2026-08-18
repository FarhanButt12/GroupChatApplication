import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ReactionDto {
  @ApiProperty({ description: 'Emoji reaction character', example: '❤️' })
  @IsString()
  @IsNotEmpty()
  emoji: string;
}
