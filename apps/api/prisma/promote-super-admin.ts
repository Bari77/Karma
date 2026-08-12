import { PrismaClient, Role } from "@prisma/client";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npm run db:promote-super-admin -- <email>");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`Aucun utilisateur trouvé pour ${email}`);
      console.error("Créez d'abord le compte via /register sur le site.");
      process.exit(1);
    }

    if (user.role === Role.SUPER_ADMIN) {
      console.log(`${email} est déjà super admin.`);
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { role: Role.SUPER_ADMIN },
    });

    console.log(`OK — ${email} (${user.username}) est maintenant SUPER_ADMIN.`);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
