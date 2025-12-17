import { prisma } from '../lib/prisma';

async function deletePendingBookings() {
  try {
    const result = await prisma.booking.deleteMany({
      where: {
        status: 'PENDING'
      }
    });

    console.log(`✅ Deleted ${result.count} PENDING bookings`);
  } catch (error) {
    console.error('❌ Error deleting bookings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deletePendingBookings();
