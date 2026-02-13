import axios from 'axios';
import { API_CONFIG } from '@/config/api';

export async function uploadImage(token: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);

    return axios.post(`${API_CONFIG.baseURL}/api/uploads`, formData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
    });
}
