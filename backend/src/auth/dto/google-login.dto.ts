import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google OAuth Credential or ID Token' })
  @IsString()
  @IsNotEmpty()
  credential: string;
}
