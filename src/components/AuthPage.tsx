import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Shield, Leaf, Trash2 } from 'lucide-react';

const googleProvider = new GoogleAuthProvider();

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'citizen' | 'cleaner' | 'admin'>('citizen');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // Use selected role or default to admin for specific email
        const finalRole = user.email === 'prishamisha112006@gmail.com' ? 'admin' : role;
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: finalRole,
          createdAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        const finalRole = email === 'prishamisha112006@gmail.com' ? 'admin' : role;
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: finalRole,
          createdAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#000080] text-white mb-6 shadow-xl">
            <Leaf size={40} />
          </div>
          <h1 className="text-4xl font-black text-[#000080] tracking-tight mb-2">SafaiSetu</h1>
          <p className="text-gray-500 font-medium">Intelligent Waste Management System</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100"
        >
          <div className="flex gap-4 mb-8 p-1 bg-gray-50 rounded-2xl">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${isLogin ? 'bg-white shadow-md text-[#000080]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${!isLogin ? 'bg-white shadow-md text-[#000080]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#000080] outline-none transition-all font-medium"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#000080] outline-none transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">I am a...</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('citizen')}
                      className={`p-3 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${role === 'citizen' ? 'border-[#FF9933] bg-[#FF9933]/5 text-[#FF9933]' : 'border-gray-100 text-gray-400 grayscale'}`}
                    >
                      <Trash2 size={20} />
                      <span className="text-[10px]">Citizen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('cleaner')}
                      className={`p-3 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${role === 'cleaner' ? 'border-[#138808] bg-[#138808]/5 text-[#138808]' : 'border-gray-100 text-gray-400 grayscale'}`}
                    >
                      <Shield size={20} />
                      <span className="text-[10px]">Cleaner</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`p-3 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${role === 'admin' ? 'border-[#000080] bg-[#000080]/5 text-[#000080]' : 'border-gray-100 text-gray-400 grayscale'}`}
                    >
                      <Shield size={20} />
                      <span className="text-[10px]">Admin</span>
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 italic text-center">
                  Note: Your role is permanent and determines your dashboard access.
                </p>
              </div>
            )}

            {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-3 rounded-xl">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#000080] text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Processing...' : isLogin ? <><LogIn size={20} /> Login</> : <><UserPlus size={20} /> Create Account</>}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-gray-300 bg-white px-4 tracking-widest">
              Or continue with
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-100 py-4 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
            Google Account
          </button>
        </motion.div>

        <p className="text-center mt-8 text-gray-400 text-xs font-medium">
          By continuing, you agree to SafaiSetu's <span className="text-gray-600 underline cursor-pointer">Terms of Service</span>
        </p>
      </div>
    </div>
  );
};
