import React, { useState } from 'react';
import { User } from '../types';

interface GroupCreationModalProps {
    currentUser: User;
    users: User[]; // All available users
    onClose: () => void;
    onCreate: (name: string, avatar: string | undefined, adminId: string, memberIds: string[]) => void;
}

const GroupCreationModal: React.FC<GroupCreationModalProps> = ({ currentUser, users, onClose, onCreate }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState(''); // Optional, maybe URL input or file upload later
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([currentUser.id]); // Auto-include self
    const [groupAdminId, setGroupAdminId] = useState<string>(currentUser.id); // Default to self

    const handleMemberToggle = (userId: string) => {
        if (userId === currentUser.id) return; // Cannot unselect self
        setSelectedMemberIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleCreate = () => {
        if (selectedMemberIds.length < 3) {
            alert('Group must have at least 3 members (including you).');
            return;
        }
        if (!name.trim()) {
            alert('Group name is required');
            return;
        }
        onCreate(name, avatar || undefined, groupAdminId, selectedMemberIds);
    };

    const potentialMembers = users.filter(u => u.id !== currentUser.id && !u.isAI && !u.isAdmin && !u.id.includes('admin')); // Filter out admins if needed, or keeping them? Prompt says "select user", usually implies regular users. Let's show all valid users.

    // Re-filtering: "should select user()user>2)".
    // "should choose admin of the group from the user (he can choose him self also)"

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                    <h2 className="text-lg font-bold">New Group</h2>
                    <button onClick={onClose} className="text-white/70 hover:text-white">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Group Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="e.g. Weekend Trip"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Group Logo (URL Optional)</label>
                                <input
                                    type="text"
                                    value={avatar}
                                    onChange={e => setAvatar(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="https://..."
                                />
                            </div>

                            <button
                                onClick={() => {
                                    if (!name.trim()) return alert('Name required');
                                    setStep(2);
                                }}
                                className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl mt-4"
                            >
                                Next: Select Members
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 mb-2">Add Members ({selectedMemberIds.length})</h3>
                                <p className="text-xs text-gray-400 mb-4">Select at least 2 other people.</p>

                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {potentialMembers.map(user => (
                                        <div key={user.id}
                                            onClick={() => handleMemberToggle(user.id)}
                                            className={`flex items-center p-2 rounded-xl border cursor-pointer transition-all ${selectedMemberIds.includes(user.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                            <img src={user.avatar} className="w-8 h-8 rounded-full mr-3 bg-gray-200 object-cover" />
                                            <span className="text-sm font-bold text-gray-700 flex-1">{user.username}</span>
                                            {selectedMemberIds.includes(user.id) && <i className="fas fa-check-circle text-indigo-600"></i>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl">Back</button>
                                <button
                                    onClick={() => {
                                        if (selectedMemberIds.length < 3) return alert('Select at least 2 others');
                                        setStep(3);
                                    }}
                                    className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1">
                                    Next: Admin
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 mb-2">Assign Group Admin</h3>
                                <p className="text-xs text-gray-400 mb-4">Who will manage this group?</p>

                                <div className="grid grid-cols-1 gap-2">
                                    {selectedMemberIds.map(mid => {
                                        const m = users.find(u => u.id === mid) || currentUser; // fallback if self
                                        return (
                                            <div key={m.id}
                                                onClick={() => setGroupAdminId(m.id)}
                                                className={`flex items-center p-3 rounded-xl border cursor-pointer ${groupAdminId === m.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-100 hover:bg-gray-50'}`}>
                                                <img src={m.avatar} className="w-8 h-8 rounded-full mr-3 bg-white/20 object-cover" />
                                                <span className={`text-sm font-bold flex-1 ${groupAdminId === m.id ? 'text-white' : 'text-gray-700'}`}>{m.id === currentUser.id ? 'You' : m.username}</span>
                                                {groupAdminId === m.id && <i className="fas fa-crown"></i>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl">Back</button>
                                <button
                                    onClick={handleCreate}
                                    className="flex-1 bg-green-500 text-white font-bold py-3 rounded-xl border-b-4 border-green-600 active:border-b-0 active:translate-y-1 shadow-lg shadow-green-200">
                                    Create Group
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupCreationModal;
