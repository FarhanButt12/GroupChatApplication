import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'NestJS Developers', description: 'Group name' })
  @IsString()
  @IsNotEmpty({ message: 'Group name is required' })
  @MinLength(3, { message: 'Group name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Group name cannot exceed 50 characters' })
  name: string;

  @ApiPropertyOptional({ example: 'Discussions about NestJS & Prisma', description: 'Optional group description' })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Description cannot exceed 200 characters' })
  description?: string;
}
