import axios from 'axios';
import supabase from './supabaseClient';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Authenticated API client: attaches the Supabase access token to every
// backend request so protected endpoints can verify the caller's identity.
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000
});

let unauthorizedHandler = null;

// App-level handler for 401 responses (session expiry / signed-out state).
export const setUnauthorizedHandler = (handler) => {
    unauthorizedHandler = handler;
};

apiClient.interceptors.request.use(async (config) => {
    try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch {
        // No session available — request proceeds without auth and will 401.
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof unauthorizedHandler === 'function') {
            try {
                unauthorizedHandler();
            } catch {
                // Handler errors must never mask the original request error.
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
