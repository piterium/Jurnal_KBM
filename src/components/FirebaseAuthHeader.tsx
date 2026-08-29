import React, { useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  type User,
} from '../firebase/firebase';
import { Cloud, CloudCheck, CloudOff, LogIn, LogOut, RefreshCw, User as UserIcon } from 'lucide-react';

interface FirebaseAuthHeaderProps {
  user: User | null;
  isAuthLoading: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  onManualSync: () => void;
}

export const FirebaseAuthHeader: React.FC<FirebaseAuthHeaderProps> = ({
  user,
  isAuthLoading,
  syncStatus,
  onManualSync,
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Login error:', err);
      if (err instanceof Error && !err.message.includes('popup-closed-by-user')) {
        setErrorMessage('Gagal login dengan Google. Silakan coba lagi.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      {/* Cloud Sync Status Indicator */}
      {user && (
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
          {syncStatus === 'syncing' && (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              <span className="text-blue-400 font-medium">Sinkronisasi Cloud...</span>
            </>
          )}
          {syncStatus === 'synced' && (
            <>
              <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Cloud Firebase Aktif</span>
            </>
          )}
          {syncStatus === 'offline' && (
            <>
              <CloudOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 font-medium">Mode Lokal</span>
            </>
          )}
          {syncStatus === 'error' && (
            <>
              <CloudOff className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-400 font-medium">Gagal Sinkron</span>
            </>
          )}

          <button
            onClick={onManualSync}
            title="Sinkronkan ulang data sekarang"
            className="ml-1 p-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* User Login Button or Profile Pill */}
      {isAuthLoading ? (
        <div className="px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 animate-pulse">
          Memuat...
        </div>
      ) : user ? (
        <div className="flex items-center gap-2 p-1 pl-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-6 h-6 rounded-full object-cover border border-blue-500/30"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}
              </div>
            )}
            <span className="text-xs font-semibold text-white max-w-[120px] truncate hidden md:inline">
              {user.displayName || user.email}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            title="Keluar dari akun Google"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          disabled={isLoggingIn}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isLoggingIn ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogIn className="w-3.5 h-3.5" />
          )}
          <span>{isLoggingIn ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
        </button>
      )}

      {errorMessage && (
        <div className="text-[11px] text-rose-400 font-medium">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
