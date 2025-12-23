import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const USERS_COUNT = 100;
const POSTS_PER_USER = 10;
const LIKES_PROBABILITY = 0.3;
const FOLLOW_PROBABILITY = 0.1;

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.repost.deleteMany();
  await prisma.like.deleteMany();
  await prisma.reply.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log(`Creating ${USERS_COUNT} users...`);
  const hashedPassword = await bcrypt.hash('Password123', 12);

  const users = await Promise.all(
    Array.from({ length: USERS_COUNT }, async () => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const username = faker.internet.userName({ firstName, lastName }).toLowerCase().slice(0, 20);

      return prisma.user.create({
        data: {
          email: faker.internet.email({ firstName, lastName }).toLowerCase(),
          username: `${username}${faker.number.int({ min: 1, max: 999 })}`,
          password: hashedPassword,
          bio: faker.person.bio().slice(0, 160),
          avatar: faker.image.avatar(),
        },
      });
    })
  );

  console.log(`Created ${users.length} users`);

  // Create a test user for easy login
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
      bio: 'This is a test account for development',
      avatar: faker.image.avatar(),
    },
  });
  users.push(testUser);
  console.log('Created test user: test@example.com / Password123');

  // Create posts
  console.log(`Creating posts...`);
  const hashtags = [
    'tech', 'coding', 'javascript', 'typescript', 'react', 'nodejs',
    'webdev', 'programming', 'ai', 'machinelearning', 'startup',
    'design', 'ux', 'product', 'news', 'trending'
  ];

  const posts: { id: string; authorId: string }[] = [];

  for (const user of users) {
    const postCount = faker.number.int({ min: 5, max: POSTS_PER_USER });

    for (let i = 0; i < postCount; i++) {
      const selectedHashtags = faker.helpers.arrayElements(
        hashtags,
        faker.number.int({ min: 0, max: 3 })
      );

      let text = faker.lorem.sentence({ min: 3, max: 15 });

      // Add hashtags to some posts
      if (selectedHashtags.length > 0) {
        text += ' ' + selectedHashtags.map(h => `#${h}`).join(' ');
      }

      // Trim to 280 characters
      text = text.slice(0, 280);

      const post = await prisma.post.create({
        data: {
          text,
          hashtags: selectedHashtags,
          authorId: user.id,
          imageUrl: faker.datatype.boolean(0.2) ? faker.image.url() : null,
          createdAt: faker.date.recent({ days: 30 }),
        },
      });

      posts.push({ id: post.id, authorId: post.authorId });
    }
  }

  console.log(`Created ${posts.length} posts`);

  // Create some thread replies
  console.log('Creating thread replies...');
  const parentPosts = faker.helpers.arrayElements(posts, Math.floor(posts.length * 0.2));
  let repliesCount = 0;

  for (const parentPost of parentPosts) {
    const replyCount = faker.number.int({ min: 1, max: 5 });

    for (let i = 0; i < replyCount; i++) {
      const replyAuthor = faker.helpers.arrayElement(users);

      await prisma.post.create({
        data: {
          text: faker.lorem.sentence({ min: 2, max: 10 }).slice(0, 280),
          hashtags: [],
          authorId: replyAuthor.id,
          parentId: parentPost.id,
          createdAt: faker.date.recent({ days: 7 }),
        },
      });

      repliesCount++;
    }

    // Update reply count
    await prisma.post.update({
      where: { id: parentPost.id },
      data: { repliesCount: replyCount },
    });
  }

  console.log(`Created ${repliesCount} replies`);

  // Create likes
  console.log('Creating likes...');
  let likesCount = 0;

  for (const post of posts) {
    for (const user of users) {
      if (user.id !== post.authorId && Math.random() < LIKES_PROBABILITY) {
        try {
          await prisma.like.create({
            data: {
              userId: user.id,
              postId: post.id,
            },
          });
          likesCount++;
        } catch {
          // Skip duplicate likes
        }
      }
    }

    // Update likes count
    const likeCount = await prisma.like.count({ where: { postId: post.id } });
    await prisma.post.update({
      where: { id: post.id },
      data: { likesCount: likeCount },
    });
  }

  console.log(`Created ${likesCount} likes`);

  // Create follows
  console.log('Creating follows...');
  let followsCount = 0;

  for (const follower of users) {
    for (const following of users) {
      if (follower.id !== following.id && Math.random() < FOLLOW_PROBABILITY) {
        try {
          await prisma.follow.create({
            data: {
              followerId: follower.id,
              followingId: following.id,
            },
          });
          followsCount++;
        } catch {
          // Skip duplicates
        }
      }
    }
  }

  // Make test user follow some users
  const usersToFollow = faker.helpers.arrayElements(users.filter(u => u.id !== testUser.id), 20);
  for (const user of usersToFollow) {
    try {
      await prisma.follow.create({
        data: {
          followerId: testUser.id,
          followingId: user.id,
        },
      });
      followsCount++;
    } catch {
      // Skip if already following
    }
  }

  console.log(`Created ${followsCount} follows`);

  console.log('\nSeed completed successfully!');
  console.log('\nTest credentials:');
  console.log('  Email: test@example.com');
  console.log('  Password: Password123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
