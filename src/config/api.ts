/**
 * API Configuration
 * 
 * This file centralizes API endpoint configuration for different environments.
 * 
 * Development: Uses relative paths (proxied by Vite to localhost:5000)
 * Production: Uses the full backend URL from environment variables
 */

export const API_CONFIG = {
    // Base URL for API requests
    // In development: empty string (uses Vite proxy)
    // In production: full backend URL (e.g., https://your-backend.onrender.com)
    baseURL: import.meta.env.VITE_API_URL || '',

    // Socket.io server URL
    // In development: empty string (connects to same origin)
    // In production: full backend URL
    socketURL: import.meta.env.VITE_SOCKET_URL || '',
};

/**
 * Helper function to build full API URL
 */
export const getApiUrl = (path: string): string => {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_CONFIG.baseURL}${normalizedPath}`;
};
