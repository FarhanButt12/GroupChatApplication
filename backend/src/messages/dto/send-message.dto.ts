import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'Hello team! Happy coding!', description: 'Chat message content' })
  @IsString()
  @IsNotEmpty({ message: 'Message content cannot be empty' })
  @MaxLength(1000, { message: 'Message content cannot exceed 1000 characters' })
  content: string;
}
