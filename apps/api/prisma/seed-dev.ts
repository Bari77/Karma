import { PrismaClient, Role, User } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seedDevUsers(prisma: PrismaClient): Promise<{ superAdmin: User; admin: User }> {
  const passwordHash = await bcrypt.hash("admin123", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@karma.local" },
    update: {},
    create: {
      email: "superadmin@karma.local",
      username: "SuperAdmin",
      passwordHash,
      role: Role.SUPER_ADMIN,
      karmaScore: 50,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@karma.local" },
    update: {},
    create: {
      email: "admin@karma.local",
      username: "AdminKarma",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: Role.ADMIN,
      karmaScore: 85,
    },
  });

  await prisma.user.upsert({
    where: { email: "user@karma.local" },
    update: {},
    create: {
      email: "user@karma.local",
      username: "JoueurTest",
      passwordHash: await bcrypt.hash("user123", 10),
      role: Role.USER,
      karmaScore: 72,
    },
  });

  return { superAdmin, admin };
}

export function logDevAccounts() {
  console.log("Comptes de test :");
  console.log("  superadmin@karma.local / admin123 (SUPER_ADMIN)");
  console.log("  admin@karma.local / admin123 (ADMIN)");
  console.log("  user@karma.local / user123 (USER)");
}

async function runStandalone() {
  const prisma = new PrismaClient();
  try {
    const { superAdmin } = await seedDevUsers(prisma);
    console.log("Seed dev OK");
    logDevAccounts();
    console.log("Super admin id:", superAdmin.id);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("prisma/seed-dev.ts");
if (isDirectRun) {
  void runStandalone();
}
