require('dotenv').config();
const bcrypt = require('bcryptjs');
const database = require('../database');

async function createAdmin() {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password || password.length < 8) {
    console.error('Usage: npm run create-admin -- "Admin Name" admin@example.com a-strong-password');
    process.exit(1);
  }
  if (database.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase())) {
    console.error('An account already uses that email.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  database.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'ADMIN')").run(name, email.toLowerCase(), hash);
  console.log(`Administrator account created for ${email}.`);
}

createAdmin();
