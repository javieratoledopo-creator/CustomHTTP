import bcrypt from "bcryptjs";
import { config } from "./config.js";
import { pool, query, one } from "./db.js";

async function main() {
  const email = (process.argv[2] ?? config.adminEmail).trim().toLowerCase();
  const password = process.argv[3] ?? config.adminPassword;
  if (!email || !password) throw new Error("Definir ADMIN_EMAIL y ADMIN_PASSWORD en .env o pasarlos como argumentos");
  if (password.length < 8) throw new Error("La contrasena del administrador debe tener al menos 8 caracteres");

  const hash = await bcrypt.hash(password, 12);
  const existing = await one("select id from admins where lower(email) = $1", [email]);
  if (existing) {
    await query("update admins set password_hash = $2, active = true where id = $1", [existing.id, hash]);
    console.log(`Administrador actualizado: ${email}`);
  } else {
    await query("insert into admins (email, password_hash, active) values ($1,$2,true)", [email, hash]);
    console.log(`Administrador creado: ${email}`);
  }
  await pool.end();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
