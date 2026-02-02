// Frontend Environment Configuration
// All environment variables should be prefixed with VITE_

// Smart API URL detection
const getApiUrl = () => {
  // 1. Check if an environment variable is explicitly provided (Build-time)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;

  // 2. Auto-detect Hostinger Production Environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If we are on the Hostinger site, we know the backend is under the /server folder
    if (hostname.includes('hostingersite.com')) {
      return '/server/api';
    }
  }

  // 3. Default to /api (Standard for local proxy or traditional subfolder setup)
  return '/api';
};

export const API_CONFIG = {
  URL: getApiUrl(),
};

export const GOOGLE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  ENABLED: !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
};

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('🔗 API URL:', API_CONFIG.URL);
  if (GOOGLE_CONFIG.ENABLED) {
    console.log('✅ Google OAuth enabled');
  } else {
    console.log('⚠️  Google OAuth not configured (optional)');
  }
}
