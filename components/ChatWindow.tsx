
import React, { useState, useRef, useEffect } from 'react';
import { User, Message, Group } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { ApiService } from '../services/api';
import GroupInfoModal from './GroupInfoModal';

interface ChatWindowProps {
  user: User;
  users?: User[]; // Optional for backward compatibility but recommended for groups
  currentUser: User;
  messages: Message[];
  onBack: () => void;
  onSendMessage: (text?: string, imageUrl?: string, audioUrl?: string, fileUrl?: string, fileName?: string, fileType?: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  group?: Group | null;
  onGroupUpdate?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ user, users = [], currentUser, messages, onBack, onSendMessage, setMessages, group, onGroupUpdate }) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const MAX_CHARS = 2000;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText;
    setInputText('');
    onSendMessage(textToSend);

    if (user.isAI) {
      setIsTyping(true);
      const history = messages.slice(-10).map(m => ({
        role: (m.senderId === currentUser.id ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: m.text || '' }]
      }));
      const aiResponse = await getGeminiResponse(textToSend, history);
      setIsTyping(false);

      const aiMsg: Message = {
        id: Date.now().toString() + "-ai",
        senderId: user.id,
        receiverId: currentUser.id,
        text: aiResponse,
        type: 'text',
        timestamp: Date.now(),
        status: 'read'
      };
      await ApiService.sendMessage(aiMsg);
      setMessages(prev => [...prev, aiMsg]);
    }
  };

  const handleVideoCall = () => {
    alert('Video calls coming soon!');
  };

  const handleVoiceCall = () => {
    alert('Voice calls coming soon!');
  };

  const handleVoiceMessage = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Convert to base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            onSendMessage(undefined, undefined, base64Audio);
          };
          reader.readAsDataURL(audioBlob);

          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          setMediaRecorder(null);
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please grant permission and try again.');
      }
    }
  };

  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        onSendMessage(undefined, base64Image);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    e.target.value = '';
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size should be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64File = reader.result as string;
        // Send file with metadata
        onSendMessage(undefined, undefined, undefined, base64File, file.name, file.type);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    e.target.value = '';
  };

  const handleEditMessage = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId);
    setEditText(currentText);
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editText.trim()) return;

    const success = await ApiService.editMessage(editingMessageId, editText, currentUser.id);
    if (success) {
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === editingMessageId ? { ...msg, text: editText } : msg
      ));
      setEditingMessageId(null);
      setEditText('');
    } else {
      alert('Failed to edit message');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    const success = await ApiService.deleteMessage(messageId, currentUser.id);
    if (success) {
      // Update local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } else {
      alert('Failed to delete message');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      <div className="bg-indigo-600 text-white p-4 pt-8 flex items-center shadow-lg z-30 sticky top-0">
        <button onClick={onBack} className="mr-3 p-2 active:scale-90 transition-transform">
          <i className="fas fa-chevron-left text-xl"></i>
        </button>
        <div 
          className={`relative group ${group ? 'cursor-pointer' : ''}`}
          onClick={() => group && setShowGroupInfo(true)}
        >
          <img
            src={user.avatar}
            className="w-10 h-10 rounded-xl bg-white/20 p-0.5 border border-white/30 shadow-inner object-cover group-hover:scale-105 transition-transform"
            alt="avatar"
          />
          {!group && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-indigo-600 shadow-sm"></div>
          )}
        </div>
        <div 
          className={`ml-3 flex-1 overflow-hidden ${group ? 'cursor-pointer' : ''}`}
          onClick={() => group && setShowGroupInfo(true)}
        >
          <h2 className="font-black text-sm truncate tracking-tight">{user.username}</h2>
          <p className="text-[9px] font-black uppercase tracking-widest opacity-70">
            {isTyping ? 'Typing...' : group ? `${group.memberIds.length} members` : 'Online'}
          </p>
        </div>
        <div className="flex space-x-4 mr-2 text-white/60">
          {!group && (
            <>
              <i className="fas fa-video hover:text-white transition-colors cursor-pointer" onClick={handleVideoCall}></i>
              <i className="fas fa-phone hover:text-white transition-colors cursor-pointer" onClick={handleVoiceCall}></i>
            </>
          )}
          {group && (
            <i className="fas fa-info-circle hover:text-white transition-colors cursor-pointer text-xl" onClick={() => setShowGroupInfo(true)}></i>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar flex flex-col connect-bg">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const sender = isMe ? currentUser : (users.find(u => u.id === msg.senderId) || user);

          return (
            <div key={msg.id} className={`max-w-[85%] animate-slide-up flex ${isMe ? 'self-end' : 'self-start items-end space-x-2'}`}>

              {!isMe && (
                <img src={sender.avatar} className="w-6 h-6 rounded-full self-end mb-1 bg-gray-200 object-cover shadow-sm" alt={sender.username} title={sender.username} />
              )}

              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && <span className="text-[10px] text-gray-400 ml-1 mb-0.5">{sender.username.split(' ')[0]}</span>}

                <div className="relative group">
                  <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm relative ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-black font-bold rounded-tl-none border border-gray-100'}`}>
                    {msg.type === 'text' && editingMessageId === msg.id ? (
                      <div className="flex flex-col space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="bg-white text-black p-2 rounded border border-gray-300 focus:outline-none focus:border-indigo-500 resize-none"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <button onClick={handleSaveEdit} className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600">
                            Save
                          </button>
                          <button onClick={handleCancelEdit} className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {msg.type === 'text' && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                        {msg.type === 'image' && <img src={msg.imageUrl} className="rounded-xl max-h-60 w-full object-cover mb-1 shadow-sm" alt="shared" />}
                        {msg.type === 'audio' && (
                          <div className="flex items-center space-x-3 min-w-[220px]">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMe ? 'bg-white/20' : 'bg-indigo-50'}`}>
                              <i className={`fas fa-microphone ${isMe ? 'text-white' : 'text-indigo-600'}`}></i>
                            </div>
                            <audio 
                              controls 
                              controlsList="nodownload noplaybackrate"
                              className="flex-1 audio-player"
                              style={{ 
                                height: '32px',
                                outline: 'none'
                              }}
                            >
                              <source src={msg.audioUrl} type="audio/webm" />
                              Your browser does not support audio playback.
                            </audio>
                          </div>
                        )}
                        {msg.type === 'file' && (
                          <a 
                            href={msg.fileUrl} 
                            download={msg.fileName}
                            className="flex items-center space-x-3 min-w-[220px] hover:opacity-80 transition-opacity"
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMe ? 'bg-white/20' : 'bg-indigo-50'}`}>
                              <i className={`fas fa-file-${msg.fileType?.includes('pdf') ? 'pdf' : msg.fileType?.includes('word') || msg.fileType?.includes('doc') ? 'word' : msg.fileType?.includes('excel') || msg.fileType?.includes('sheet') ? 'excel' : msg.fileType?.includes('powerpoint') || msg.fileType?.includes('presentation') ? 'powerpoint' : 'alt'} ${isMe ? 'text-white' : 'text-indigo-600'}`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate ${isMe ? 'text-white' : 'text-gray-900'}`}>{msg.fileName}</p>
                              <p className={`text-xs ${isMe ? 'text-white/70' : 'text-gray-500'}`}>Click to download</p>
                            </div>
                            <i className={`fas fa-download ${isMe ? 'text-white/70' : 'text-gray-400'}`}></i>
                          </a>
                        )}
                        <div className={`mt-1 flex items-center justify-end space-x-1.5 opacity-60 ${isMe ? 'text-indigo-100' : 'text-gray-400'}`}>
                          <span className="text-[9px] font-black">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && <i className={`fas fa-check-double text-[8px] ${msg.status === 'read' ? 'text-teal-300' : 'text-indigo-300'}`}></i>}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Edit/Delete buttons - only show for own messages */}
                  {isMe && editingMessageId !== msg.id && (
                    <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                      {msg.type === 'text' && (
                        <button
                          onClick={() => handleEditMessage(msg.id, msg.text || '')}
                          className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 shadow-md"
                          title="Edit message"
                        >
                          <i className="fas fa-edit text-xs"></i>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md"
                        title="Delete message"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="self-start bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 flex flex-col pb-8">
        {/* Hidden file inputs */}
        <input
          type="file"
          ref={imageInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageChange}
        />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip"
          onChange={handleFileChange}
        />
        
        <div className="flex items-end space-x-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl flex items-center px-4 py-1.5 focus-within:bg-white focus-within:border-indigo-300 transition-all shadow-inner relative">
            <textarea
              ref={textareaRef}
              className="flex-1 focus:outline-none text-sm py-2 bg-transparent resize-none overflow-y-auto custom-scrollbar text-black font-black leading-tight placeholder:text-gray-400"
              placeholder="Message..."
              rows={1}
              maxLength={MAX_CHARS}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          
          {/* File upload button */}
          <button 
            onClick={handleFileUpload}
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-indigo-600 transition-all active:scale-90 shrink-0"
            title="Send file"
          >
            <i className="fas fa-paperclip text-lg"></i>
          </button>
          
          {/* Image upload button */}
          <button 
            onClick={handleImageUpload}
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-indigo-600 transition-all active:scale-90 shrink-0"
            title="Send image"
          >
            <i className="fas fa-image text-lg"></i>
          </button>
          
          {/* Send/Audio button */}
          <button 
            onClick={inputText.trim() ? handleSend : handleVoiceMessage} 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 shrink-0 ${inputText.trim() ? 'bg-indigo-600 text-white shadow-indigo-200' : isRecording ? 'bg-red-500 text-white shadow-red-200 animate-pulse' : 'bg-gray-100 text-gray-300 shadow-none'}`}
            title={inputText.trim() ? 'Send message' : isRecording ? 'Stop recording' : 'Record audio'}
          >
            <i className={`fas ${inputText.trim() ? 'fa-paper-plane' : isRecording ? 'fa-stop' : 'fa-microphone'} text-lg`}></i>
          </button>
        </div>
      </div>

      {/* Group Info Modal */}
      {showGroupInfo && group && (
        <GroupInfoModal
          group={group}
          currentUser={currentUser}
          allUsers={users}
          onClose={() => setShowGroupInfo(false)}
          onUpdate={() => {
            setShowGroupInfo(false);
            if (onGroupUpdate) onGroupUpdate();
          }}
        />
      )}
    </div>
  );
};

export default ChatWindow;
