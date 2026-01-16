
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Message, MainSection, Group } from '../types';
import { ApiService } from '../services/api';
import GroupCreationModal from './GroupCreationModal';

interface MainViewProps {
  users: User[];
  groups: Group[];
  currentUser: User;
  messages: Message[];
  onSelectChat: (user: User) => void;
  onSelectGroup: (group: Group) => void;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  onCreateGroup: (name: string, avatar: string | undefined, adminId: string, memberIds: string[]) => void;
  onDeleteGroup: (groupId: string) => void;
  onOpenAdminPanel?: () => void;
}

const MainView: React.FC<MainViewProps> = ({ users, groups, currentUser, messages, onSelectChat, onSelectGroup, onLogout, onUpdateUser, onCreateGroup, onDeleteGroup, onOpenAdminPanel }) => {
  const [section, setSection] = useState<MainSection>('chats');
  const [search, setSearch] = useState('');
  const [dbConnected, setDbConnected] = useState(false);
  const [tempUrl, setTempUrl] = useState(ApiService.getBaseUrl());
  const [showGroupModal, setShowGroupModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = setInterval(() => {
      setDbConnected(ApiService.checkConnection());
    }, 2000);
    return () => clearInterval(check);
  }, []);

  const activeChatUsers = useMemo(() => {
    const talkerIds = new Set<string>();
    messages.forEach((m: Message) => {
      if (m.senderId === currentUser.id) talkerIds.add(m.receiverId);
      if (m.receiverId === currentUser.id) talkerIds.add(m.senderId);
    });
    return users.filter(u => talkerIds.has(u.id));
  }, [users, messages, currentUser.id]);

  const filteredUsers = useMemo(() => {
    const targetList = section === 'chats' ? activeChatUsers : users;
    const query = search.toLowerCase().trim();
    if (!query) return targetList;
    return targetList.filter(u =>
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  }, [section, activeChatUsers, users, search]);

  const handleInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Connect',
          text: `Hey! Chat with me on Connect using my email: ${currentUser.email}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed');
      }
    } else {
      alert(`Share this link: ${window.location.href}`);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onUpdateUser({ ...currentUser, avatar: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Banned User Banner */}
      {currentUser.isBanned && (
        <div className="bg-red-500 text-white p-3 text-center font-black text-sm">
          <i className="fas fa-ban mr-2"></i>
          Your account has been banned. You can view but cannot perform actions.
        </div>
      )}
      
      {/* Hidden file input for avatar upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="px-6 pt-safe pb-6 bg-indigo-600 text-white shadow-lg z-20">
        <div className="flex justify-between items-center mt-4 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight italic">CONNECT</h1>
              <div className={`w-2.5 h-2.5 rounded-full border-2 border-indigo-600 ${dbConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">
              {dbConnected ? 'Cloud Sync Active' : 'Offline / Local Only'}
            </p>
          </div>
          <button onClick={() => setSection('profile')} className="relative group active:scale-90 transition-all">
            <img src={currentUser.avatar} className="w-11 h-11 rounded-2xl bg-white/20 p-0.5 border border-white/30 shadow-md group-hover:shadow-indigo-400/20 transition-all object-cover" alt="me" />
          </button>
        </div>

        {section !== 'profile' && (
          <div className="relative animate-slide-up">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-sm"></i>
            <input
              type="text"
              placeholder={`Search in ${section}...`}
              className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:bg-white/20 transition-all placeholder:text-white/40 text-white font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
        {section === 'profile' ? (
          <div className="p-6 space-y-6 animate-slide-up">
            <div className="flex flex-col items-center text-center py-4">
              <div className="relative mb-4 cursor-pointer group" onClick={handleAvatarClick}>
                <img src={currentUser.avatar} className="w-24 h-24 rounded-[2rem] shadow-2xl bg-white p-1 border border-gray-100 object-cover group-hover:opacity-90 transition-opacity" alt="avatar" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] bg-black/20">
                  <i className="fas fa-camera text-white text-xl"></i>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-7 h-7 rounded-full border-4 border-slate-50 shadow-sm flex items-center justify-center">
                  <i className="fas fa-pen text-[8px] text-white"></i>
                </div>
              </div>
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                {currentUser.username}
                {currentUser.isAdmin && (
                  <span className="bg-indigo-600 text-white text-[9px] px-2 py-1 rounded-full uppercase tracking-widest">Admin</span>
                )}
              </h2>
              <p className="text-gray-500 text-xs font-bold tracking-wider uppercase opacity-60">{currentUser.email}</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Connection Engine</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                To chat across devices, deploy a backend and enter the URL here. Currently using: <span className="font-mono text-indigo-400">{ApiService.getBaseUrl()}</span>
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-mono text-gray-600 focus:outline-none focus:border-indigo-300"
                  placeholder="https://your-api.com/api"
                />
                <button
                  onClick={() => ApiService.setBaseUrl(tempUrl)}
                  className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-indigo-100"
                >
                  Apply
                </button>
              </div>
            </div>

            {currentUser.isAdmin && onOpenAdminPanel && (
              <button
                onClick={onOpenAdminPanel}
                className="w-full py-4 bg-indigo-50 text-indigo-600 font-black rounded-2xl flex items-center justify-center space-x-2 active:bg-indigo-100 transition-colors uppercase text-xs tracking-widest"
              >
                <i className="fas fa-shield-alt"></i>
                <span>Admin Panel</span>
              </button>
            )}

            <button
              onClick={onLogout}
              className="w-full py-4 bg-red-50 text-red-600 font-black rounded-2xl flex items-center justify-center space-x-2 active:bg-red-100 transition-colors uppercase text-xs tracking-widest"
            >
              <i className="fas fa-power-off"></i>
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {section === 'groups' && (
              <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-black tracking-tight text-gray-800">Groups</h2>
                <button
                  onClick={() => setShowGroupModal(true)}
                  className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all">
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            )}

            {section === 'groups' && (
              <div className="divide-y divide-gray-50">
                {groups.length === 0 && (
                  <div className="p-10 text-center text-gray-400 text-sm font-bold">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-users text-2xl text-gray-300"></i>
                    </div>
                    No groups yet. Create one!
                  </div>
                )}
                {groups.map(group => (
                  <div key={group.id}
                    className="flex items-center p-5 hover:bg-white active:bg-indigo-50 cursor-pointer transition-all border-l-4 border-l-transparent hover:border-l-indigo-500 group relative"
                    onClick={() => onSelectGroup(group)}>
                    <img src={group.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${group.name}`} className="w-14 h-14 rounded-2xl shadow-sm bg-gray-100 object-cover border border-gray-100" />
                    <div className="ml-4 flex-1">
                      <h3 className="font-bold text-gray-900">{group.name}</h3>
                      <p className="text-xs text-gray-500">{group.memberIds.length} members</p>
                    </div>

                    {/* Delete Option: Group Admin OR Super Admin */}
                    {(group.adminId === currentUser.id || currentUser.isAdmin) && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm(`Delete group "${group.name}"?`)) {
                            onDeleteGroup(group.id);
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {section === 'chats' && (section !== 'profile') && (
              <div className="p-4 bg-white border-b border-gray-100 overflow-x-auto no-scrollbar flex space-x-5 items-center">
                <div className="flex flex-col items-center space-y-2 shrink-0 cursor-pointer group" onClick={handleInvite}>
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-indigo-300 flex items-center justify-center bg-indigo-50 group-active:scale-90 transition-all overflow-hidden">
                      <i className="fas fa-plus text-indigo-400"></i>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">Invite</span>
                </div>
                {users.filter(u => !u.isAdmin || currentUser.isAdmin).slice(0, 8).map(u => (
                  <div 
                    key={u.id} 
                    className="flex flex-col items-center space-y-2 shrink-0 animate-slide-up group cursor-pointer" 
                    onClick={() => {
                      if (currentUser.isBanned) {
                        alert('You are banned and cannot send messages.');
                        return;
                      }
                      onSelectChat(u);
                    }}
                  >
                    <div className="w-14 h-14 rounded-full p-0.5 border-2 border-indigo-500 group-active:scale-90 transition-all shadow-sm">
                      <img src={u.avatar} className="w-full h-full rounded-full object-cover bg-gray-100 border border-white" alt={u.username} />
                    </div>
                    <span className="text-[10px] font-black text-gray-800 uppercase truncate w-14 text-center">{u.username.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            )}

            {(section === 'chats' || section === 'universe') && (
              <div className="divide-y divide-gray-50">
                {filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center p-20 text-center">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                    <i className="fas fa-satellite text-3xl text-indigo-200"></i>
                  </div>
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No Discovery</p>
                  <button onClick={handleInvite} className="mt-4 text-[10px] font-black bg-indigo-600 text-white px-6 py-2 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-100">
                    Invite via Link
                  </button>
                </div>
              )}
              {filteredUsers.filter(u => !u.isAdmin || currentUser.isAdmin).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center p-5 hover:bg-white active:bg-indigo-50/50 cursor-pointer transition-all border-l-4 border-l-transparent hover:border-l-indigo-500 group relative"
                >
                  <div onClick={() => {
                    if (currentUser.isBanned) {
                      alert('You are banned and cannot send messages.');
                      return;
                    }
                    onSelectChat(user);
                  }} className="flex items-center flex-1 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={user.avatar}
                        className="w-14 h-14 rounded-2xl shadow-md bg-white border border-gray-100 group-hover:scale-105 transition-transform object-cover"
                        alt={user.username}
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-[3px] border-slate-50 shadow-sm"></div>
                    </div>
                    <div className="ml-4 flex-1 overflow-hidden">
                      <div className="flex justify-between items-center mb-0.5">
                        <h3 className="font-bold text-gray-900 truncate tracking-tight flex items-center gap-2">
                          {user.username}
                          {user.isAdmin && <span className="bg-red-100 text-red-600 text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">Admin</span>}
                        </h3>
                        {/* Status/Time could go here */}
                      </div>
                      <p className="text-xs text-gray-500 truncate font-medium opacity-80">{user.status}</p>
                    </div>
                  </div>

                  {currentUser.isAdmin && !user.isAdmin && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete ${user.username}?`)) {
                          await ApiService.deleteUser(user.id);
                          // Force reload to refresh list is simplest for now, ideally update state
                          window.location.reload();
                        }
                      }}
                      className="ml-2 w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-100 flex justify-around p-3 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <NavBtn active={section === 'chats'} icon="fa-comment-alt" label="Chats" onClick={() => setSection('chats')} />
        <NavBtn active={section === 'groups'} icon="fa-users" label="Groups" onClick={() => setSection('groups')} />
        <NavBtn active={section === 'universe'} icon="fa-globe-americas" label="Universe" onClick={() => setSection('universe')} />
        <NavBtn active={section === 'profile'} icon="fa-user-cog" label="Settings" onClick={() => setSection('profile')} />
      </div>

      {
        showGroupModal && (
          <GroupCreationModal
            users={users}
            currentUser={currentUser}
            onClose={() => setShowGroupModal(false)}
            onCreate={(name, avatar, adminId, memberIds) => {
              onCreateGroup(name, avatar, adminId, memberIds);
              setShowGroupModal(false);
            }}
          />
        )
      }
    </div >
  );
};

const NavBtn = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center space-y-1.5 transition-all flex-1 py-2 ${active ? 'text-indigo-600' : 'text-gray-400'}`}>
    <i className={`fas ${icon} ${active ? 'text-xl' : 'text-lg'}`}></i>
    <span className="text-[9px] font-black uppercase tracking-[0.15em]">{label}</span>
  </button>
);

export default MainView;
