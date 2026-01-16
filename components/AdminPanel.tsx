import React, { useState, useEffect } from 'react';
import { User, Group } from '../types';
import { ApiService } from '../services/api';

interface AdminPanelProps {
  currentUser: User;
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const allUsers = await ApiService.getUniverseForAdmin(currentUser.id);
    const allGroups = await ApiService.getAllGroupsForAdmin(currentUser.id);
    setUsers(allUsers.filter(u => u.id !== currentUser.id));
    setGroups(allGroups);
    setLoading(false);
  };

  const handleBanUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to permanently ban ${username}? This will delete all their messages and remove them from all groups.`)) {
      return;
    }

    const success = await ApiService.banUser(userId, currentUser.id);
    if (success) {
      alert(`${username} has been banned successfully`);
      loadData();
    } else {
      alert('Failed to ban user');
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete the group "${groupName}"? All messages in this group will be deleted.`)) {
      return;
    }

    const success = await ApiService.deleteGroup(groupId, currentUser.id);
    if (success) {
      alert(`Group "${groupName}" has been deleted successfully`);
      loadData();
    } else {
      alert('Failed to delete group');
    }
  };

  const handleCleanupTestData = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL users (except admin), ALL messages, and ALL groups. This action cannot be undone. Are you sure?')) {
      return;
    }

    if (!confirm('This is your FINAL confirmation. All test data will be permanently deleted. Continue?')) {
      return;
    }

    setLoading(true);
    const result = await ApiService.cleanupTestData(currentUser.id);
    setLoading(false);

    if (result) {
      alert(`Cleanup completed!\n\nUsers deleted: ${result.usersDeleted}\nMessages deleted: ${result.messagesDeleted}\nGroups deleted: ${result.groupsDeleted}`);
      loadData();
    } else {
      alert('Failed to cleanup test data');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 pt-8 flex items-center shadow-lg z-30 sticky top-0">
        <button onClick={onBack} className="mr-3 p-2 active:scale-90 transition-transform">
          <i className="fas fa-chevron-left text-xl"></i>
        </button>
        <div className="flex-1">
          <h2 className="font-black text-lg tracking-tight">Admin Panel</h2>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
            Manage Users & Groups
          </p>
        </div>
        <i className="fas fa-shield-alt text-2xl"></i>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-3 text-sm font-black uppercase tracking-wider transition-colors ${
            activeTab === 'users'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-3 text-sm font-black uppercase tracking-wider transition-colors ${
            activeTab === 'groups'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Groups ({groups.length})
        </button>
      </div>

      {/* Cleanup Button */}
      <div className="p-4 bg-red-50 border-b border-red-100">
        <button
          onClick={handleCleanupTestData}
          className="w-full py-3 bg-red-500 text-white rounded-xl font-black text-sm flex items-center justify-center space-x-2 hover:bg-red-600 transition-colors"
        >
          <i className="fas fa-trash-alt"></i>
          <span>Cleanup All Test Data (Keep Admin Only)</span>
        </button>
        <p className="text-xs text-red-600 text-center mt-2 font-bold">
          ⚠️ This will delete all users, messages, and groups except admin
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Loading...</div>
          </div>
        ) : activeTab === 'users' ? (
          <>
            {users.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No users found</div>
            ) : (
              users.map(user => (
                <div
                  key={user.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center space-x-3"
                >
                  <img
                    src={user.avatar}
                    className="w-12 h-12 rounded-xl object-cover"
                    alt={user.username}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm truncate">{user.username}</h3>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    {user.isBanned && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded">
                        BANNED
                      </span>
                    )}
                    {user.isAdmin && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded">
                        ADMIN
                      </span>
                    )}
                  </div>
                  {!user.isBanned && !user.isAdmin && (
                    <button
                      onClick={() => handleBanUser(user.id, user.username)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-black hover:bg-red-600 transition-colors"
                    >
                      BAN
                    </button>
                  )}
                </div>
              ))
            )}
          </>
        ) : (
          <>
            {groups.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No groups found</div>
            ) : (
              groups.map(group => (
                <div
                  key={group.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center space-x-3"
                >
                  <img
                    src={group.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${group.name}`}
                    className="w-12 h-12 rounded-xl object-cover"
                    alt={group.name}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm truncate">{group.name}</h3>
                    <p className="text-xs text-gray-500">{group.memberIds.length} members</p>
                  </div>
                  <button
                    onClick={() => handleDeleteGroup(group.id, group.name)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-black hover:bg-red-600 transition-colors"
                  >
                    DELETE
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
