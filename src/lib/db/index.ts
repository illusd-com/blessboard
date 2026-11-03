import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.warn("TURSO_DATABASE_URL is not set. Database features will fail.");
}

const client = createClient({
  url: url || "file:local.db",
  authToken: authToken,
});

export const db = drizzle(client, { schema });

export * from "./schema";
