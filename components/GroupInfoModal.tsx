import React, { useState, useEffect } from 'react';
import { Group, User } from '../types';
import { ApiService } from '../services/api';

interface GroupInfoModalProps {
  group: Group;
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onUpdate: () => void;
}

const GroupInfoModal: React.FC<GroupInfoModalProps> = ({ group, currentUser, allUsers, onClose, onUpdate }) => {
  const [members, setMembers] = useState<User[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const isAdmin = group.adminId === currentUser.id;

  useEffect(() => {
    // Get member details
    const memberDetails = allUsers.filter(u => group.memberIds.includes(u.id));
    setMembers(memberDetails);

    // Get users not in group
    const notInGroup = allUsers.filter(u => !group.memberIds.includes(u.id) && !u.isAI);
    setAvailableUsers(notInGroup);
  }, [group, allUsers]);

  const handleRemoveMember = async (userId: string, username: string) => {
    if (!confirm(`Remove ${username} from the group?`)) return;

    const success = await ApiService.removeMemberFromGroup(group.id, userId, currentUser.id);
    if (success) {
      onUpdate();
    } else {
      alert('Failed to remove member');
    }
  };

  const handleAddMember = async (userId: string) => {
    const success = await ApiService.addMemberToGroup(group.id, userId, currentUser.id);
    if (success) {
      setShowAddMember(false);
      onUpdate();
    } else {
      alert('Failed to add member');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-indigo-600 text-white p-6 flex items-center space-x-4">
          <img
            src={group.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${group.name}`}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30"
            alt={group.name}
          />
          <div className="flex-1">
            <h2 className="font-black text-xl">{group.name}</h2>
            <p className="text-sm opacity-80">{members.length} members</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-120px)] custom-scrollbar">
          {/* Add Member Button (Admin Only) */}
          {isAdmin && !showAddMember && (
            <div className="p-4 border-b border-gray-100">
              <button
                onClick={() => setShowAddMember(true)}
                className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-sm flex items-center justify-center space-x-2 hover:bg-indigo-100 transition-colors"
              >
                <i className="fas fa-user-plus"></i>
                <span>Add Member</span>
              </button>
            </div>
          )}

          {/* Add Member Section */}
          {showAddMember && (
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-sm text-gray-700">Add Member</h3>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {availableUsers.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No users available to add</p>
                ) : (
                  availableUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleAddMember(user.id)}
                    >
                      <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt={user.username} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{user.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <i className="fas fa-plus-circle text-indigo-500"></i>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="p-4">
            <h3 className="font-black text-xs uppercase tracking-wider text-gray-400 mb-3">Members</h3>
            <div className="space-y-2">
              {members.map(member => {
                const isMemberAdmin = member.id === group.adminId;
                const canRemove = isAdmin && !isMemberAdmin;

                return (
                  <div
                    key={member.id}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <img
                      src={member.avatar}
                      className="w-12 h-12 rounded-full object-cover"
                      alt={member.username}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{member.username}</p>
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                      {isMemberAdmin && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded">
                          GROUP ADMIN
                        </span>
                      )}
                    </div>
                    {canRemove && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.username)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <i className="fas fa-user-minus"></i>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;
