import axios from 'axios';
import { API_CONFIG } from '@/config/api';

// Get all tasks for a board
export async function fetchTasks(token: string, boardId: string) {
    return axios.get(`${API_CONFIG.baseURL}/api/tasks/board/${boardId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// Create a new task
export async function createTask(token: string, data: any) {
    return axios.post(`${API_CONFIG.baseURL}/api/tasks`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// Update a task
export async function updateTask(token: string, id: string, data: any) {
    return axios.put(`${API_CONFIG.baseURL}/api/tasks/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// Delete a task
export async function deleteTask(token: string, id: string) {
    return axios.delete(`${API_CONFIG.baseURL}/api/tasks/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// Complete a task
export async function completeTask(token: string, id: string, data: { comment?: string, screenshotUrl?: string }) {
    return axios.post(`${API_CONFIG.baseURL}/api/tasks/${id}/complete`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}
