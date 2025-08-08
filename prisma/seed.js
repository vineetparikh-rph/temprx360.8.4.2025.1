// prisma/seed.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@georgiesrx.com";
  const plainPassword = "Pharmacy10";
  const hashedPassword = bcrypt.hashSync(plainPassword, 10);

  // 1. Create or update pharmacy
  const pharmacy = await prisma.pharmacy.upsert({
    where: { code: "PARLIN" }, // assuming 'code' is unique in your schema
    update: {
      name: "Georgies Parlin Pharmacy",
      address: "499 Ernston Road, Parlin, NJ 08859",
    },
    create: {
      name: "Georgies Parlin Pharmacy",
      code: "PARLIN",
      address: "499 Ernston Road, Parlin, NJ 08859",
    },
  });

  // 2. Create or update admin user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Admin",
      role: "admin",
      hashedPassword,
    },
    create: {
      email,
      name: "Admin",
      role: "admin",
      hashedPassword,
    },
  });

  // 3. Link user to pharmacy
  await prisma.userPharmacy.upsert({
    where: {
      // adjust if your schema has a different unique constraint
      userId_pharmacyId: { userId: user.id, pharmacyId: pharmacy.id },
    },
    update: {},
    create: {
      userId: user.id,
      pharmacyId: pharmacy.id,
    },
  });

  console.log("✅ Database seeded successfully");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${plainPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
