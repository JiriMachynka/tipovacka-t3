import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./db/schema.ts",
  driver: "pg",
  out: "./db/migrations",
  dbCredentials: { 
    connectionString: process.env.NEXT_PUBLIC_DATABASE_URL as string,
  },
} satisfies Config;