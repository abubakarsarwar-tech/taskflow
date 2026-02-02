import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Server Configuration
export const SERVER_CONFIG = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Database Configuration
export const DB_CONFIG = {
  HOST: process.env.DB_HOST || 'localhost',
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD,
  NAME: process.env.DB_NAME,
  PORT: process.env.DB_PORT || 3306,
};

// JWT Configuration
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET,
  EXPIRES_IN: '30d',
};

// CORS Configuration
export const CORS_CONFIG = {
  ORIGINS: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:8080', 'https://test.primeblogspace.com'],
};

// Frontend Configuration
export const FRONTEND_CONFIG = {
  URL: process.env.FRONTEND_URL || 'http://localhost:8080',
};

// Google OAuth Configuration
export const GOOGLE_CONFIG = {
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',
  ENABLED: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
};

// Validate required environment variables
export function validateEnv() {
  const required = {
    DB_HOST: DB_CONFIG.HOST,
    DB_USER: DB_CONFIG.USER,
    DB_NAME: DB_CONFIG.NAME,
    JWT_SECRET: JWT_CONFIG.SECRET,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\n💡 Check your server/.env file\n');
    process.exit(1);
  }

  // Warn about optional Google OAuth
  if (!GOOGLE_CONFIG.ENABLED) {
    console.log('⚠️  Google OAuth is not configured (optional)');
    console.log('   To enable, add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env\n');
  }

  // Warn about optional Email configuration
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('⚠️  Email service is not configured (optional)');
    console.log('   To enable email invitations, add EMAIL_USER and EMAIL_PASSWORD to .env');
    console.log('   For Gmail, use an App Password (not your regular password)\n');
  }
}
