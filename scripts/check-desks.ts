// Quick script to check desks in the database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const desks = await prisma.desk.findMany({
    include: {
      photos: true,
      availableDates: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  console.log('Found', desks.length, 'desks');

  for (const desk of desks) {
    console.log('\n---');
    console.log('Desk:', desk.id);
    console.log('Title:', desk.title_en);
    console.log('Created:', desk.createdAt);
    console.log('Photos:', desk.photos.length);

    if (desk.photos.length > 0) {
      console.log('Photo URLs:');
      for (const photo of desk.photos) {
        console.log('  -', photo.url);
        console.log('    Thumbnail:', photo.thumbnailUrl);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
