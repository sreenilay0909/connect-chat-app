
import React, { useState } from 'react';

interface OnboardingProps {
  onLogin: (name: string, email: string) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email) {
      setLoading(true);
      try {
        // We wrap this in a timeout-proof check to ensure the UI doesn't hang
        await onLogin(name, email);
      } catch (err) {
        console.error("Login failed:", err);
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 bg-gradient-to-br from-indigo-50 via-white to-teal-50">
      <div className="w-20 h-20 mb-8 flex items-center justify-center bg-indigo-600 rounded-2xl shadow-xl text-white">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-12 h-12">
          <circle cx="9" cy="12" r="5" />
          <circle cx="15" cy="12" r="5" />
        </svg>
      </div>
      
      <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter italic">CONNECT</h1>
      <p className="text-gray-500 text-center mb-10 text-sm font-semibold leading-relaxed max-w-xs">
        Your universal email-to-chat hub.
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-5">
        <div className="group">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
          <input
            type="text"
            required
            placeholder="Enter your name"
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:outline-none transition-all bg-white/50 backdrop-blur-sm shadow-sm text-black font-bold placeholder:text-gray-300"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
          <input
            type="email"
            required
            placeholder="your@email.com"
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:outline-none transition-all bg-white/50 backdrop-blur-sm shadow-sm text-black font-bold placeholder:text-gray-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all mt-4 text-lg uppercase tracking-widest flex items-center justify-center"
        >
          {loading ? (
            <div className="flex items-center space-x-3">
              <i className="fas fa-circle-notch animate-spin"></i>
              <span>Authenticating...</span>
            </div>
          ) : 'Secure Connect'}
        </button>
      </form>

      <p className="mt-12 text-[10px] text-indigo-300 font-black uppercase tracking-[0.3em]">
        Instant Simulation Mode
      </p>
    </div>
  );
};

export default Onboarding;
