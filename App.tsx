
import React, { useState, useEffect, useCallback } from 'react';
import { User, Message, ViewState, Group } from './types';
import Onboarding from './components/Onboarding';
import MainView from './components/MainView';
import ChatWindow from './components/ChatWindow';
import AdminPanel from './components/AdminPanel';
import { ApiService } from './services/api';

const AI_CONTACT: User = {
  id: 'gemini-ai',
  username: 'Connect AI',
  email: 'ai@connect.com',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=connect',
  status: 'Intelligent Assistant 🤖',
  isAI: true
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('onboarding');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [universeUsers, setUniverseUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Load persistence session
  useEffect(() => {
    const saved = localStorage.getItem('connect_session_user');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
      setView('main');
    }
  }, []);

  // Sync Logic - Aggressive polling for real-world multi-user feel
  const syncData = useCallback(async () => {
    if (!currentUser) return;

    // 1. Fetch Universe (Everyone else)
    let globalUsers;
    if (currentUser.isAdmin) {
      // Admin sees all users including other admins
      globalUsers = await ApiService.getUniverseForAdmin(currentUser.id);
    } else {
      // Regular users don't see admin
      globalUsers = await ApiService.getUniverse();
    }
    
    const myLatestSelf = globalUsers.find(u => u.id === currentUser.id);

    if (!myLatestSelf && currentUser.id !== AI_CONTACT.id) {
      console.warn('User no longer exists in universe (Banned?). Logging out...');
      // handleLogout(); // User banning logic handled by UI feedback mostly, avoiding immediate force logout if just network glitch
    }

    const otherUsers = globalUsers.filter(u => u.id !== currentUser.id);
    
    // For regular users, add AI contact. For admin, don't add AI
    if (currentUser.isAdmin) {
      setUniverseUsers(otherUsers);
    } else {
      setUniverseUsers([AI_CONTACT, ...otherUsers]);
    }

    // 2. Fetch Groups
    const userGroups = await ApiService.getUserGroups(currentUser.id);
    setGroups(userGroups);

    // 3. Fetch specific messages if chat is open
    if (selectedUser) {
      const chatHistory = await ApiService.getMessages(currentUser.id, selectedUser.id);
      // Always update to catch edits/deletes, not just new messages
      setMessages(chatHistory);
    } else if (selectedGroup) {
      const groupHistory = await ApiService.getGroupMessages(selectedGroup.id);
      // Always update to catch edits/deletes, not just new messages
      setMessages(groupHistory);
    }
  }, [currentUser, selectedUser, selectedGroup]);

  useEffect(() => {
    if (!currentUser) return;
    syncData();
    const interval = setInterval(syncData, 2000);
    return () => clearInterval(interval);
  }, [currentUser, syncData]);

  const handleLogin = async (name: string, email: string) => {
    try {
      const user = await ApiService.registerUser({ username: name, email });
      if (!user) throw new Error('Failed to login');
      setCurrentUser(user);
      localStorage.setItem('connect_session_user', JSON.stringify(user));
      
      // Check if user is banned
      if (user.isBanned) {
        // Show banned message but allow them to see the app in read-only mode
        alert('Your account has been banned. You can view the app but cannot send messages or perform actions.');
      }
      
      setView('main');
    } catch (error: any) {
      console.error('Login error', error);
      alert('Failed to login. Please try again.');
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('connect_session_user', JSON.stringify(updatedUser));
  };

  const handleGroupUpdate = () => {
    // Trigger a sync to refresh group data
    syncData();
  };

  const handleSendMessage = async (text?: string, imageUrl?: string, audioUrl?: string, fileUrl?: string, fileName?: string, fileType?: string) => {
    if (!currentUser) return;
    if (!selectedUser && !selectedGroup) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      receiverId: selectedGroup ? selectedGroup.id : selectedUser!.id,
      text,
      imageUrl,
      audioUrl,
      fileUrl,
      fileName,
      fileType,
      type: fileUrl ? 'file' : audioUrl ? 'audio' : imageUrl ? 'image' : 'text',
      timestamp: Date.now(),
      status: 'sent',
      groupId: selectedGroup?.id
    };

    // Optimistic Update
    setMessages(prev => [...prev, newMessage]);

    // Save to DB
    const success = await ApiService.sendMessage(newMessage);
    if (!success) {
      console.error('Failed to send message');
    }
  };

  const handleCreateGroup = async (name: string, avatar: string | undefined, adminId: string, memberIds: string[]) => {
    if (!currentUser) return;
    const newGroup = await ApiService.createGroup({ name, avatar, adminId, memberIds });
    if (newGroup) {
      setGroups(prev => [...prev, newGroup]);
      alert('Group created!');
    } else {
      alert('Failed to create group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!currentUser) return;
    const success = await ApiService.deleteGroup(groupId, currentUser.id);
    if (success) {
      setGroups(prev => prev.filter(g => g.id !== groupId));
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setView('main');
      }
    } else {
      alert('Failed to delete group');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('connect_session_user');
    setCurrentUser(null);
    setView('onboarding');
  };

  // Prepare chat partner display object for ChatWindow
  const chatPartner = selectedGroup
    ? {
      id: selectedGroup.id,
      username: selectedGroup.name,
      avatar: selectedGroup.avatar || '',
      status: `${selectedGroup.memberIds.length} members`,
      email: 'Group',
      isAI: false
    } as User
    : selectedUser;

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-white shadow-2xl relative overflow-hidden border-x border-gray-100">
      {view === 'onboarding' && <Onboarding onLogin={handleLogin} />}

      {view === 'main' && currentUser && (
        <MainView
          users={universeUsers}
          groups={groups}
          currentUser={currentUser}
          messages={messages}
          onSelectChat={(user) => { setSelectedUser(user); setSelectedGroup(null); setView('chat-window'); }}
          onSelectGroup={(group) => { setSelectedGroup(group); setSelectedUser(null); setView('chat-window'); }}
          onLogout={handleLogout}
          onUpdateUser={handleUpdateUser}
          onCreateGroup={handleCreateGroup}
          onDeleteGroup={handleDeleteGroup}
          onOpenAdminPanel={() => setView('admin-panel')}
        />
      )}

      {view === 'admin-panel' && currentUser && currentUser.isAdmin && (
        <AdminPanel
          currentUser={currentUser}
          onBack={() => setView('main')}
        />
      )}

      {view === 'chat-window' && chatPartner && currentUser && (
        <ChatWindow
          user={chatPartner}
          users={universeUsers}
          currentUser={currentUser}
          messages={messages}
          onBack={() => { setView('main'); setSelectedUser(null); setSelectedGroup(null); }}
          onSendMessage={handleSendMessage}
          setMessages={setMessages}
          group={selectedGroup}
          onGroupUpdate={handleGroupUpdate}
        />
      )}
    </div>
  );
};

export default App;
