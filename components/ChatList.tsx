
import React, { useState } from 'react';
import { User } from '../types';

interface ChatListProps {
  users: User[];
  currentUser: User | null;
  onSelectChat: (user: User) => void;
  onLogout: () => void;
}

const ChatList: React.FC<ChatListProps> = ({ users, currentUser, onSelectChat, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-[#075E54] text-white p-4 pb-12">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <img src={currentUser?.avatar} className="w-10 h-10 rounded-full border-2 border-white/20" alt="avatar" />
            <h1 className="text-xl font-bold">MailChat</h1>
          </div>
          <div className="flex space-x-4 items-center">
            <button className="text-xl hover:bg-white/10 p-2 rounded-full transition-colors"><i className="fas fa-camera"></i></button>
            <button 
              onClick={onLogout}
              className="text-xl hover:bg-white/10 p-2 rounded-full transition-colors"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
        
        {/* Tabs - WhatsApp Style */}
        <div className="flex w-full justify-around uppercase text-xs font-bold tracking-wider pt-2 opacity-80">
          <div className="pb-2 flex items-center"><i className="fas fa-users mr-2"></i></div>
          <div className="pb-2 border-b-4 border-white">Chats</div>
          <div className="pb-2">Status</div>
          <div className="pb-2">Calls</div>
        </div>
      </div>

      {/* Search Bar - Positioned over header/list junction */}
      <div className="px-4 -mt-6">
        <div className="relative bg-white shadow-md rounded-xl p-2 flex items-center">
          <i className="fas fa-search text-gray-400 mx-2"></i>
          <input
            type="text"
            placeholder="Search name or email..."
            className="w-full focus:outline-none text-sm py-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto mt-4 custom-scrollbar">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <i className="fas fa-comment-slash text-3xl mb-2"></i>
            <p>No contacts found</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => onSelectChat(user)}
              className="flex items-center p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer border-b border-gray-100 transition-colors"
            >
              <div className="relative">
                <img src={user.avatar} className="w-14 h-14 rounded-full" alt={user.username} />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="ml-4 flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">{user.username}</h3>
                  <span className="text-xs text-gray-400">12:45 PM</span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <p className="text-sm text-gray-500 truncate w-48 italic">
                    {user.status}
                  </p>
                  {user.isAI && (
                    <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">AI</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button className="absolute bottom-6 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform">
        <i className="fas fa-comment-dots text-xl"></i>
      </button>
    </div>
  );
};

export default ChatList;
