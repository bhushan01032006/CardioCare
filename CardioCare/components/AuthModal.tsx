import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'signup';
  onAuthSuccess: (user: { name: string; email: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Reset form state whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        email: '',
        password: ''
      });
      setMode(initialMode);
      setError(null);
      setLoading(false);
      setShowPassword(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));

    // Retrieve users from localStorage
    const storedUsers = JSON.parse(localStorage.getItem('cardioCare_users') || '{}');
    const { email, password, name } = formData;
    const cleanEmail = email.toLowerCase().trim();

    if (mode === 'signup') {
        // Check if user already exists
        if (storedUsers[cleanEmail]) {
            setLoading(false);
            setError("Account already exists. Please log in.");
            setMode('login');
            return;
        }

        // Create new user
        storedUsers[cleanEmail] = { name, password };
        localStorage.setItem('cardioCare_users', JSON.stringify(storedUsers));
        
        setLoading(false);
        onAuthSuccess({ name, email: cleanEmail });
    } else {
        // Login Logic
        const user = storedUsers[cleanEmail];
        
        // If user does not exist, switch to Signup
        if (!user) {
            setLoading(false);
            setError("Account not found. Please create an account.");
            setMode('signup');
            return;
        }

        // Check password
        if (user.password !== password) {
             setLoading(false);
             setError("Incorrect password.");
             return;
        }

        // Success
        setLoading(false);
        onAuthSuccess({ name: user.name, email: cleanEmail });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                    {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                    {mode === 'login' ? 'Enter your details to access your reports.' : 'Sign up to start your health assessment.'}
                </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 bg-white rounded-full border border-slate-200 hover:bg-slate-100">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Form */}
        <div className="p-8">
            {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm font-medium animate-pulse">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                
                {mode === 'signup' && (
                    <div className="space-y-1.5 animate-fade-in">
                        <label className="text-sm font-semibold text-slate-700">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                            <input 
                                type="text" 
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="Full Name"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-900"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                        <input 
                            type="email" 
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="you@example.com"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-900"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            placeholder="••••••••"
                            className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-900"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            {mode === 'login' ? 'Sign In' : 'Create Account'}
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                    {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        onClick={() => {
                            setMode(mode === 'login' ? 'signup' : 'login');
                            setError(null);
                        }}
                        className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                        {mode === 'login' ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};