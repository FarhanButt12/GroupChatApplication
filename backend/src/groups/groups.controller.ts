import { Body, Controller, Get, Param, Post, UseGuards, } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupsService } from './groups.service';

@ApiTags('Groups')
@ApiBearerAuth('JWT-auth')
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) { }

  @ApiOperation({ summary: 'Create a new group (Creator becomes ADMIN)' })
  @Post()
  async createGroup(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateGroupDto,
  ) {
    return this.groupsService.createGroup(userId, dto);
  }

  @ApiOperation({ summary: 'List all groups' })
  @Get()
  async getAllGroups() {
    return this.groupsService.getAllGroups();
  }

  @ApiOperation({ summary: 'Get single group details by ID' })
  @Get(':id')
  async getGroupById(@Param('id') id: string) {
    return this.groupsService.getGroupById(id);
  }

  @ApiOperation({ summary: 'Join a group' })
  @Post(':id/join')
  async joinGroup(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.groupsService.joinGroup(userId, id);
  }
}
