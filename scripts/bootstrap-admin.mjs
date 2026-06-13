#!/usr/bin/env node
/**
 * Promotes a user to admin by email.
 * Usage: npm run bootstrap-admin -- admin@example.com
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;

  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const email = process.argv[2] || process.env.ADMIN_EMAIL;

if (!email) {
  console.error("Usage: npm run bootstrap-admin -- <email>");
  console.error("Or set ADMIN_EMAIL in .env.local");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: user, error: findError } = await supabase
  .from("users")
  .select("id, email, role")
  .eq("email", email)
  .maybeSingle();

if (findError) {
  console.error("Error finding user:", findError.message);
  process.exit(1);
}

if (!user) {
  console.error(`No user found with email: ${email}`);
  console.error("The user must sign up first, then run this script.");
  process.exit(1);
}

if (user.role === "admin") {
  console.log(`${email} is already an admin.`);
  process.exit(0);
}

const { error: updateError } = await supabase
  .from("users")
  .update({ role: "admin" })
  .eq("id", user.id);

if (updateError) {
  console.error("Error promoting user:", updateError.message);
  process.exit(1);
}

console.log(`Successfully promoted ${email} to admin.`);
