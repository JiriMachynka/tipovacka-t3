import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { env } from "@/env.mjs";

const client = new Client({ connectionString: env.NEXT_PUBLIC_DATABASE_URL });

await client.connect();
export const db = drizzle(client);