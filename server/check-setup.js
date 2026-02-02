import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

console.log('🔍 Checking server setup...\n');

// Check .env file
const envPath = join(__dirname, '.env');
if (!existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('💡 Create a .env file in the server directory with:');
  console.log('   PORT=5000');
  console.log('   DB_HOST=localhost');
  console.log('   DB_PORT=3306');
  console.log('   DB_NAME=taskflow_local');
  console.log('   DB_USER=root');
  console.log('   DB_PASSWORD=your_password');
  console.log('   JWT_SECRET=your-super-secret-jwt-key');
  console.log('   CORS_ORIGIN=http://localhost:8080\n');
  process.exit(1);
} else {
  console.log('✅ .env file exists');
}

// Check required environment variables
const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];
const optional = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'EMAIL_USER', 'EMAIL_PASSWORD'];
let missing = [];

required.forEach(key => {
  if (!process.env[key]) {
    missing.push(key);
    console.error(`❌ ${key} is not set in .env`);
  } else {
    console.log(`✅ ${key} is set`);
  }
});

if (missing.length > 0) {
  console.log('\n💡 Add the missing variables to your .env file\n');
  process.exit(1);
}

// Check optional features
console.log('\n📋 Optional features:');
optional.forEach(key => {
  if (process.env[key]) {
    if (key.startsWith('GOOGLE_')) {
      console.log(`✅ ${key} is set (Google OAuth enabled)`);
    } else if (key.startsWith('EMAIL_')) {
      console.log(`✅ ${key} is set (Email service enabled)`);
    } else {
      console.log(`✅ ${key} is set`);
    }
  } else {
    if (key.startsWith('GOOGLE_')) {
      console.log(`⚠️  ${key} is not set (Google OAuth disabled)`);
    } else if (key.startsWith('EMAIL_')) {
      console.log(`⚠️  ${key} is not set (Email verification disabled)`);
    } else {
      console.log(`⚠️  ${key} is not set`);
    }
  }
});

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.log('\n💡 To enable Google login, add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env');
}

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.log('💡 To enable email verification, add EMAIL_USER and EMAIL_PASSWORD to .env');
}

console.log('\n✅ All required setup checks passed!');
console.log('🚀 You can now start the server with: npm run dev\n');

