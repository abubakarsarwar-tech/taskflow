import axios from 'axios';
import { API_CONFIG } from '@/config/api';

// Get all boards for the authenticated user
export async function fetchBoards(token: string) {
  return axios.get(`${API_CONFIG.baseURL}/api/boards`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Create a new board
export async function createBoard(token: string, data: { name: string; description?: string; isPublic?: boolean; }) {
  return axios.post(`${API_CONFIG.baseURL}/api/boards`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Get all public boards (community)
export async function fetchCommunityBoards() {
  return axios.get(`${API_CONFIG.baseURL}/api/boards/community`);
}

// Update a board
export async function updateBoard(token: string, id: string, data: { name?: string; description?: string; isPublic?: boolean }) {
  return axios.put(`${API_CONFIG.baseURL}/api/boards/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Delete a board
export async function deleteBoard(token: string, id: string) {
  return axios.delete(`${API_CONFIG.baseURL}/api/boards/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Update a member's role
export async function updateMemberRole(token: string, boardId: string, memberId: string, role: string) {
  return axios.put(`${API_CONFIG.baseURL}/api/boards/${boardId}/members/${memberId}`, { role }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Add a member to a board by email
export async function addMember(token: string, boardId: string, email: string) {
  return axios.post(`${API_CONFIG.baseURL}/api/boards/${boardId}/members`, { email }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Accept a board invitation
export async function acceptMemberInvitation(token: string, boardId: string) {
  return axios.post(`${API_CONFIG.baseURL}/api/boards/${boardId}/members/accept`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Reject a board invitation
export async function rejectMemberInvitation(token: string, boardId: string) {
  return axios.post(`${API_CONFIG.baseURL}/api/boards/${boardId}/members/reject`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Remove a member from a board
export async function removeMember(token: string, boardId: string, memberId: string) {
  return axios.delete(`${API_CONFIG.baseURL}/api/boards/${boardId}/members/${memberId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Get board preview (public)
export async function fetchBoardPreview(id: string) {
  return axios.get(`${API_CONFIG.baseURL}/api/boards/${id}/preview`);
}
