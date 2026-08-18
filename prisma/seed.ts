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

  // 1. Create 10 Users
  const userNames = [
    'alice',
    'bob',
    'charlie',
    'diana',
    'eve',
    'frank',
    'grace',
    'hank',
    'ivy',
    'jack',
  ];

  const users: Record<string, any> = {};

  for (const username of userNames) {
    users[username] = await prisma.user.create({
      data: {
        email: `${username}@example.com`,
        username,
        password: passwordHash,
      },
    });
  }

  console.log('✅ Created 10 Users: Alice, Bob, Charlie, Diana, Eve, Frank, Grace, Hank, Ivy, Jack');

  // 2. Create Group 1: Tech Talk (Alice is ADMIN)
  const techGroup = await prisma.group.create({
    data: {
      name: 'Tech Talk',
      description: 'Discussing NestJS, PostgreSQL, Prisma & Backend Architecture',
      members: {
        create: [
          { userId: users['alice'].id, role: 'ADMIN' },
          { userId: users['bob'].id, role: 'MEMBER' },
          { userId: users['charlie'].id, role: 'MEMBER' },
          { userId: users['eve'].id, role: 'MEMBER' },
          { userId: users['frank'].id, role: 'MEMBER' },
        ],
      },
    },
  });

  // 3. Create Group 2: Gaming Hub (Bob is ADMIN)
  const gamingGroup = await prisma.group.create({
    data: {
      name: 'Gaming Hub',
      description: 'Gamers assemble for evening multiplayer sessions',
      members: {
        create: [
          { userId: users['bob'].id, role: 'ADMIN' },
          { userId: users['charlie'].id, role: 'MEMBER' },
          { userId: users['diana'].id, role: 'MEMBER' },
          { userId: users['grace'].id, role: 'MEMBER' },
          { userId: users['hank'].id, role: 'MEMBER' },
        ],
      },
    },
  });

  // 4. Create Group 3: AI & Machine Learning (Eve is ADMIN)
  const aiGroup = await prisma.group.create({
    data: {
      name: 'AI & Machine Learning',
      description: 'Exploring LLMs, Neural Networks, and AI Innovation',
      members: {
        create: [
          { userId: users['eve'].id, role: 'ADMIN' },
          { userId: users['alice'].id, role: 'MEMBER' },
          { userId: users['frank'].id, role: 'MEMBER' },
          { userId: users['ivy'].id, role: 'MEMBER' },
          { userId: users['jack'].id, role: 'MEMBER' },
        ],
      },
    },
  });

  // 5. Create Group 4: Design & UX (Grace is ADMIN)
  const designGroup = await prisma.group.create({
    data: {
      name: 'Design & UX',
      description: 'UI/UX best practices, Figma prototypes, and micro-interactions',
      members: {
        create: [
          { userId: users['grace'].id, role: 'ADMIN' },
          { userId: users['diana'].id, role: 'MEMBER' },
          { userId: users['hank'].id, role: 'MEMBER' },
          { userId: users['ivy'].id, role: 'MEMBER' },
          { userId: users['jack'].id, role: 'MEMBER' },
        ],
      },
    },
  });

  console.log('✅ Created 4 Groups: Tech Talk, Gaming Hub, AI & ML, Design & UX');

  // 6. Create Messages in Tech Talk
  await prisma.message.createMany({
    data: [
      {
        content: 'Welcome everyone to Tech Talk!',
        groupId: techGroup.id,
        senderId: users['alice'].id,
      },
      {
        content: 'Hey Alice! Excited to build with NestJS and Prisma.',
        groupId: techGroup.id,
        senderId: users['bob'].id,
      },
      {
        content: 'Count me in! Database indexing makes pagination instant.',
        groupId: techGroup.id,
        senderId: users['charlie'].id,
      },
      {
        content: 'Clean architecture makes the codebase super maintainable.',
        groupId: techGroup.id,
        senderId: users['eve'].id,
      },
    ],
  });

  // 7. Create Messages in Gaming Hub
  await prisma.message.createMany({
    data: [
      {
        content: 'Who is up for some multiplayer games tonight?',
        groupId: gamingGroup.id,
        senderId: users['bob'].id,
      },
      {
        content: 'I am ready! What game are we playing?',
        groupId: gamingGroup.id,
        senderId: users['diana'].id,
      },
      {
        content: 'Let us set up a tournament!',
        groupId: gamingGroup.id,
        senderId: users['grace'].id,
      },
    ],
  });

  // 8. Create Messages in AI & Machine Learning
  await prisma.message.createMany({
    data: [
      {
        content: 'Welcome to AI & Machine Learning group!',
        groupId: aiGroup.id,
        senderId: users['eve'].id,
      },
      {
        content: 'Has anyone tested the latest Gemini model APIs?',
        groupId: aiGroup.id,
        senderId: users['ivy'].id,
      },
      {
        content: 'Yes! The latency and reasoning capabilities are top tier.',
        groupId: aiGroup.id,
        senderId: users['jack'].id,
      },
    ],
  });

  // 9. Create Messages in Design & UX
  await prisma.message.createMany({
    data: [
      {
        content: 'Welcome designers and UX enthusiasts!',
        groupId: designGroup.id,
        senderId: users['grace'].id,
      },
      {
        content: 'Excited to share some dark mode glassmorphism UI mockups!',
        groupId: designGroup.id,
        senderId: users['ivy'].id,
      },
    ],
  });

  console.log('✅ Created initial chat messages across all 4 groups!');
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
