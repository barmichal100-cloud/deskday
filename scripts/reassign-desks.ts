import { prisma } from "../lib/prisma";

async function reassignDesks() {
  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: "barmichal100@gmail.com" },
    });

    if (!user) {
      console.error("User not found with email: barmichal100@gmail.com");
      return;
    }

    console.log(`Found user: ${user.name} (${user.email}), ID: ${user.id}`);

    // Count existing desks
    const deskCount = await prisma.desk.count();
    console.log(`Total desks in database: ${deskCount}`);

    // Update all desks to belong to this user
    const result = await prisma.desk.updateMany({
      data: {
        ownerId: user.id,
      },
    });

    console.log(`✅ Successfully reassigned ${result.count} desks to ${user.name}`);
  } catch (error) {
    console.error("Error reassigning desks:", error);
  } finally {
    await prisma.$disconnect();
  }
}

reassignDesks();
