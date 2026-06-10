import { PrismaClient } from "@prisma/client";


// créer une seule instance de PrismaClient
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
})

// Gérer l'arrêt en douceur
process.on("beforeExit", async () => {
    await prisma.$disconnect();
});

process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    process.exit(0);
});


export default prisma;