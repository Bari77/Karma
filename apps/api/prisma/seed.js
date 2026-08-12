"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const passwordHash = await bcryptjs_1.default.hash("admin123", 10);
    const superAdmin = await prisma.user.upsert({
        where: { email: "superadmin@karma.local" },
        update: {},
        create: {
            email: "superadmin@karma.local",
            username: "SuperAdmin",
            passwordHash,
            role: client_1.Role.SUPER_ADMIN,
            karmaScore: 100,
        },
    });
    const admin = await prisma.user.upsert({
        where: { email: "admin@karma.local" },
        update: {},
        create: {
            email: "admin@karma.local",
            username: "AdminKarma",
            passwordHash: await bcryptjs_1.default.hash("admin123", 10),
            role: client_1.Role.ADMIN,
            karmaScore: 85,
        },
    });
    await prisma.user.upsert({
        where: { email: "user@karma.local" },
        update: {},
        create: {
            email: "user@karma.local",
            username: "JoueurTest",
            passwordHash: await bcryptjs_1.default.hash("user123", 10),
            role: client_1.Role.USER,
            karmaScore: 72,
        },
    });
    const actions = [
        { label: "Aider un collègue", points: 5, type: client_1.ActionType.GOOD },
        { label: "Faire du sport", points: 8, type: client_1.ActionType.GOOD },
        { label: "Méditer 10 minutes", points: 6, type: client_1.ActionType.GOOD },
        { label: "Lire 30 minutes", points: 4, type: client_1.ActionType.GOOD },
        { label: "Être en retard", points: 3, type: client_1.ActionType.BAD },
        { label: "Gronder quelqu'un", points: 5, type: client_1.ActionType.BAD },
        { label: "Passer la journée sur les réseaux", points: 4, type: client_1.ActionType.BAD },
    ];
    for (const action of actions) {
        const existing = await prisma.action.findFirst({
            where: { label: action.label },
        });
        if (!existing) {
            await prisma.action.create({
                data: {
                    ...action,
                    status: client_1.ActionStatus.ACTIVE,
                    validatedById: admin.id,
                },
            });
        }
    }
    console.log("Seed OK — comptes de test :");
    console.log("  superadmin@karma.local / admin123 (SUPER_ADMIN)");
    console.log("  admin@karma.local / admin123 (ADMIN)");
    console.log("  user@karma.local / user123 (USER)");
    console.log("Super admin id:", superAdmin.id);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
