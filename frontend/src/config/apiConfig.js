/**
 * API Configuration Module
 * Provides centralized API base URL management with environment variable support
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const createApiUrl = (endpoint) => {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${API_BASE_URL}/${cleanEndpoint}`;
};

export default {
    API_BASE_URL,
    createApiUrl
};
