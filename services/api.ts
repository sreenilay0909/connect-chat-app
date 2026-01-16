
import { User, Message, StatusUpdate, Group } from '../types';

/**
 * PRODUCTION URL: In a real deployment, this would be your Render/Railway URL.
 * Defaults to 'http://localhost:3001' for local development with MongoDB backend.
 * Set to 'LOCAL_MOCK' to use localStorage fallback without backend.
 */
const ENV_URL = (process.env as any).BACKEND_URL;
let BASE_URL = localStorage.getItem('connect_api_url') || ENV_URL || 'http://localhost:3001';

export class ApiService {
  private static isConnected = false;
  private static connectionAttempted = false;

  static setBaseUrl(url: string) {
    localStorage.setItem('connect_api_url', url);
    BASE_URL = url;
    window.location.reload();
  }

  static getBaseUrl(): string {
    return BASE_URL;
  }

  static checkConnection(): boolean {
    return this.isConnected;
  }

  private static getGravatar(email: string): string {
    const cleanEmail = email.trim().toLowerCase();
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`;
  }

  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
    // If we are in mock mode, return null immediately to trigger fallback logic
    if (BASE_URL === 'LOCAL_MOCK') return null;

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000); // Shorter 3s timeout

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...options?.headers },
      });
      clearTimeout(id);

      if (!response.ok) {
        // Log the error for debugging
        const errorText = await response.text();
        console.error(`[ApiService] Request failed: ${response.status} ${response.statusText}`, errorText);
        const err: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
        err.status = response.status;
        throw err;
      }

      this.isConnected = true;
      this.connectionAttempted = true;
      return await response.json();
    } catch (e) {
      console.error('[ApiService] Request error:', e);
      this.isConnected = false;
      this.connectionAttempted = true;
      return null;
    }
  }

  static async registerUser(userData: Partial<User>): Promise<User> {
    const avatar = userData.avatar || this.getGravatar(userData.email || '');
    const payload = {
      ...userData,
      avatar,
      status: 'Hey there! I am using Connect.',
      lastSeen: Date.now()
    };

    // Attempt network request
    const response = await this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // If network fails or is in MOCK mode, use LocalStorage
    if (!response) {
      const localUser = {
        ...payload,
        id: 'u-' + Math.random().toString(36).substr(2, 9),
      } as User;

      const localUsers = JSON.parse(localStorage.getItem('connect_mock_users') || '[]');
      const existing = localUsers.find((u: any) => u.email === localUser.email);

      if (!existing) {
        localUsers.push(localUser);
        localStorage.setItem('connect_mock_users', JSON.stringify(localUsers));
        return localUser;
      }
      return existing;
    }
    return response;
  }

  static async getUniverse(): Promise<User[]> {
    const users = await this.request<User[]>('/users');
    if (!users) {
      return JSON.parse(localStorage.getItem('connect_mock_users') || '[]');
    }
    return users;
  }

  static async getUniverseForAdmin(adminId: string): Promise<User[]> {
    const users = await this.request<User[]>(`/users?adminId=${adminId}`);
    if (!users) {
      return JSON.parse(localStorage.getItem('connect_mock_users') || '[]');
    }
    return users;
  }

  static async banUser(userId: string, adminId: string): Promise<boolean> {
    try {
      await this.request(`/users/${userId}/ban`, {
        method: 'POST',
        body: JSON.stringify({ adminId })
      });
      return true;
    } catch (error) {
      console.error('Failed to ban user:', error);
      return false;
    }
  }

  static async getAllGroupsForAdmin(adminId: string): Promise<Group[]> {
    try {
      const groups = await this.request<Group[]>(`/groups/all?adminId=${adminId}`);
      return groups || [];
    } catch (error) {
      console.error('Failed to fetch all groups:', error);
      return [];
    }
  }

  static async cleanupTestData(adminId: string): Promise<{ usersDeleted: number; messagesDeleted: number; groupsDeleted: number } | null> {
    try {
      const result = await this.request<{ usersDeleted: number; messagesDeleted: number; groupsDeleted: number }>('/users/cleanup', {
        method: 'POST',
        body: JSON.stringify({ adminId })
      });
      return result;
    } catch (error) {
      console.error('Failed to cleanup test data:', error);
      return null;
    }
  }

  static async addMemberToGroup(groupId: string, userId: string, adminId: string): Promise<boolean> {
    try {
      await this.request(`/groups/${groupId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId, adminId })
      });
      return true;
    } catch (error) {
      console.error('Failed to add member:', error);
      return false;
    }
  }

  static async removeMemberFromGroup(groupId: string, userId: string, adminId: string): Promise<boolean> {
    try {
      await this.request(`/groups/${groupId}/members`, {
        method: 'DELETE',
        body: JSON.stringify({ userId, adminId })
      });
      return true;
    } catch (error) {
      console.error('Failed to remove member:', error);
      return false;
    }
  }

  static async sendMessage(message: Message): Promise<boolean> {
    console.log('[ApiService] Sending message:', message);
    const response = await this.request<any>('/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });

    console.log('[ApiService] Send message response:', response);

    if (!response) {
      console.log('[ApiService] No response, falling back to localStorage');
      const local = JSON.parse(localStorage.getItem('connect_temp_msgs') || '[]');
      local.push(message);
      localStorage.setItem('connect_temp_msgs', JSON.stringify(local));
      return true; // Return true so UI proceeds in mock mode
    }
    return !!response;
  }

  static async getMessages(user1Id: string, user2Id: string): Promise<Message[]> {
    const all = await this.request<Message[]>(`/messages?u1=${user1Id}&u2=${user2Id}`);
    if (!all) {
      const local = JSON.parse(localStorage.getItem('connect_temp_msgs') || '[]');
      return local.filter((m: Message) =>
        (m.senderId === user1Id && m.receiverId === user2Id) ||
        (m.senderId === user2Id && m.receiverId === user1Id)
      );
    }
    return all;
  }
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      await this.request(`/users/${userId}`, { method: 'DELETE' });
      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return false;
    }
  }

  // Group API
  static async createGroup(data: { name: string; avatar?: string; adminId: string; memberIds: string[] }): Promise<Group | null> {
    try {
      return await this.request('/groups', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to create group:', error);
      return null;
    }
  }

  static async getUserGroups(userId: string): Promise<Group[]> {
    try {
      return await this.request(`/groups?userId=${userId}`);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      return [];
    }
  }

  static async deleteGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      await this.request(`/groups/${groupId}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId })
      });
      return true;
    } catch (error) {
      console.error('Failed to delete group:', error);
      return false;
    }
  }

  static async getGroupMessages(groupId: string): Promise<Message[]> {
    try {
      return await this.request(`/messages?groupId=${groupId}`);
    } catch (error) {
      console.error('Failed to fetch group messages:', error);
      return [];
    }
  }

  static async editMessage(messageId: string, newText: string, userId: string): Promise<boolean> {
    try {
      await this.request(`/messages/${messageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ text: newText, userId })
      });
      return true;
    } catch (error) {
      console.error('Failed to edit message:', error);
      return false;
    }
  }

  static async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    try {
      await this.request(`/messages/${messageId}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId })
      });
      return true;
    } catch (error) {
      console.error('Failed to delete message:', error);
      return false;
    }
  }
}
