import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { USER_SELECT } from '../common/constants/user-select.constant';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(userId: string, dto: CreateGroupDto) {
    const group = await this.prisma.group.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        members: {
          create: {
            userId: userId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: USER_SELECT,
            },
          },
        },
      },
    });

    return {
      message: 'Group created successfully',
      group,
    };
  }

  async getAllGroups() {
    const groups = await this.prisma.group.findMany({
      include: {
        members: {
          select: {
            userId: true,
            role: true,
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      groups,
    };
  }

  async getGroupById(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: USER_SELECT,
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID '${groupId}' not found`);
    }

    return {
      group,
    };
  }

  async joinGroup(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID '${groupId}' not found`);
    }

    const existingMembership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('You are already a member of this group');
    }

    const membership = await this.prisma.groupMember.create({
      data: {
        groupId,
        userId,
        role: 'MEMBER',
      },
      include: {
        group: true,
        user: {
          select: USER_SELECT,
        },
      },
    });

    return {
      message: 'Successfully joined group',
      membership,
    };
  }

  async leaveGroup(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID '${groupId}' not found`);
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this group');
    }

    await this.prisma.groupMember.delete({
      where: {
        id: membership.id,
      },
    });

    return {
      message: 'Successfully left group',
    };
  }
}
