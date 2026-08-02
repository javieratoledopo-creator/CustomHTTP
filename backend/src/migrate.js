import fs from "fs";
import path from "path";
import { pool, query } from "./db.js";

const dir = path.resolve(import.meta.dirname, "../../database/migrations");

async function main() {
  await query(`create table if not exists _migrations (
    name text primary key, applied_at timestamptz not null default now())`);
  const applied = new Set((await query("select name from _migrations")).rows.map((r) => r.name));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`= ${file} (ya aplicada)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into _migrations (name) values ($1)", [file]);
      await client.query("commit");
      console.log(`+ ${file} aplicada`);
    } catch (err) {
      await client.query("rollback");
      throw err;
    } finally {
      client.release();
    }
  }
  await pool.end();
  console.log("Migraciones completadas.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
