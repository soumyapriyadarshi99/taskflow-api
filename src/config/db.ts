import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
// config/db.ts — Creates and exports Prisma client singleton. All DB access goes via this. (Day 2)

import { PrismaClient } from "../generated/prisma/client.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

export default prisma;
