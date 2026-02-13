import axios from 'axios';
import { API_CONFIG } from '@/config/api';

// Get all notifications
export async function fetchNotifications(token: string) {
    return axios.get(`${API_CONFIG.baseURL}/api/notifications`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// Mark a notification as read
export async function markAsRead(token: string, id: string) {
    return axios.put(`${API_CONFIG.baseURL}/api/notifications/${id}/read`, {}, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// Mark all notifications as read
export async function markAllAsRead(token: string) {
    return axios.put(`${API_CONFIG.baseURL}/api/notifications/read-all`, {}, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// Delete a single notification
export async function deleteNotification(token: string, id: string) {
    return axios.delete(`${API_CONFIG.baseURL}/api/notifications/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// Clear all notifications
export async function clearAllNotifications(token: string) {
    return axios.delete(`${API_CONFIG.baseURL}/api/notifications/clear-all/all`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}
