
export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  status: string;
  isAI?: boolean;
  lastSeen?: number;
  isAdmin?: boolean;
}

export interface StatusUpdate {
  userId: string;
  imageUrl: string;
  caption: string;
  timestamp: number;
}

export interface Group {
  id: string;
  name: string;
  avatar?: string;
  adminId: string;
  memberIds: string[];
  createdAt: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  type: 'text' | 'image' | 'audio' | 'file';
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
  groupId?: string;
}

export type MainSection = 'chats' | 'universe' | 'profile' | 'groups';
export type ViewState = 'onboarding' | 'main' | 'chat-window' | 'admin-panel';
