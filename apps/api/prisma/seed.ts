import { PrismaClient } from "@prisma/client";
import { seedActions } from "./seed-actions";
import { logDevAccounts, seedDevUsers } from "./seed-dev";

export function shouldSeedDevUsers(): boolean {
  const env = process.env.SEED_DEV_USERS;
  if (env !== undefined) {
    return env === "true" || env === "1";
  }
  return process.env.NODE_ENV !== "production";
}

async function main() {
  const prisma = new PrismaClient();
  const seedDev = shouldSeedDevUsers();

  try {
    let validatedById: string | undefined;

    if (seedDev) {
      await seedDevUsers(prisma);
      const admin = await prisma.user.findUniqueOrThrow({
        where: { email: "admin@karma.local" },
      });
      validatedById = admin.id;
    }

    const result = await seedActions(prisma, validatedById);

    console.log("Seed OK");
    console.log(`Actions : ${result.good} bonnes, ${result.bad} mauvaises`);

    if (seedDev) {
      logDevAccounts();
    } else {
      console.log("Comptes de test ignorés (SEED_DEV_USERS=false ou NODE_ENV=production)");
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
