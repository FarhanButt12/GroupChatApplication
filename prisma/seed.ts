import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  await prisma.message.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create 4 Users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      username: 'alice',
      password: passwordHash,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      username: 'bob',
      password: passwordHash,
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      username: 'charlie',
      password: passwordHash,
    },
  });

  const diana = await prisma.user.create({
    data: {
      email: 'diana@example.com',
      username: 'diana',
      password: passwordHash,
    },
  });

  console.log('✅ Created 4 Users: Alice, Bob, Charlie, Diana');

  // 2. Create Group 1: Tech Talk (Alice is ADMIN, Bob & Charlie join)
  const techGroup = await prisma.group.create({
    data: {
      name: 'Tech Talk',
      description: 'Discussing NestJS, PostgreSQL & Prisma',
      members: {
        create: [
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id, role: 'MEMBER' },
          { userId: charlie.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // 3. Create Group 2: Gaming Hub (Bob is ADMIN, Charlie & Diana join)
  const gamingGroup = await prisma.group.create({
    data: {
      name: 'Gaming Hub',
      description: 'Gamers assemble for evening multiplayer sessions',
      members: {
        create: [
          { userId: bob.id, role: 'ADMIN' },
          { userId: charlie.id, role: 'MEMBER' },
          { userId: diana.id, role: 'MEMBER' },
        ],
      },
    },
  });

  console.log('✅ Created 2 Groups: Tech Talk & Gaming Hub');

  // 4. Create Messages in Tech Talk
  await prisma.message.createMany({
    data: [
      {
        content: 'Welcome everyone to Tech Talk!',
        groupId: techGroup.id,
        senderId: alice.id,
      },
      {
        content: 'Hey Alice! Excited to build with NestJS and Prisma.',
        groupId: techGroup.id,
        senderId: bob.id,
      },
      {
        content: 'Count me in! The database indexes work super fast.',
        groupId: techGroup.id,
        senderId: charlie.id,
      },
      {
        content: 'Awesome! Phase 1 REST API is completely functional.',
        groupId: techGroup.id,
        senderId: alice.id,
      },
    ],
  });

  // 5. Create Messages in Gaming Hub
  await prisma.message.createMany({
    data: [
      {
        content: 'Who is up for some multiplayer games tonight?',
        groupId: gamingGroup.id,
        senderId: bob.id,
      },
      {
        content: 'I am ready! What game are we playing?',
        groupId: gamingGroup.id,
        senderId: diana.id,
      },
      {
        content: 'Count me in as well!',
        groupId: gamingGroup.id,
        senderId: charlie.id,
      },
    ],
  });

  console.log('✅ Created initial chat messages across both groups!');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
