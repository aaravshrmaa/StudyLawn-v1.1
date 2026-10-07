import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, ExamRegionPreset } from '../types';
import { localStore } from '../lib/storage';

export interface LocalUser {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    exam_goal?: string;
    exam_region?: ExamRegionPreset;
    target_date?: string;
    target_daily_hours?: number;
    timezone?: string;
    time_format?: '12h' | '24h';
    [key: string]: any;
  };
  created_at?: string;
}

interface AuthContextType {
  user: LocalUser | null;
  session: { access_token: string; user: LocalUser } | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'signin' | 'signup';
  setAuthModalMode: (mode: 'signin' | 'signup') => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  signUp: (...args: any[]) => Promise<{ error: any }>;
  signIn: (...args: any[]) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  requestPasswordReset: (...args: any[]) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  openProfileModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_PROFILE: UserProfile = {
  id: 'local_study_user',
  name: 'User',
  examGoal: 'Deep Work & Daily Focus',
  examRegion: 'Global',
  targetDailyHours: 8,
  timezone: 'auto',
  timeFormat: '12h',
  createdAt: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    return localStore.getSync<UserProfile>('user_profile', DEFAULT_PROFILE);
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Sync profile to unlimited IndexedDB store asynchronously
  useEffect(() => {
    localStore.get<UserProfile>('user_profile', DEFAULT_PROFILE).then((saved) => {
      if (saved) setProfile((prev) => ({ ...prev, ...saved }));
    });
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ error: any }> => {
    try {
      const updated: UserProfile = {
        ...profile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      setProfile(updated);
      await localStore.set('user_profile', updated);
      return { error: null };
    } catch (err: any) {
      console.warn('Profile update error:', err);
      return { error: err };
    }
  };

  const user: LocalUser = {
    id: profile.id,
    email: 'local@student.app',
    user_metadata: {
      name: profile.name,
      exam_goal: profile.examGoal,
      exam_region: profile.examRegion,
      target_date: profile.targetDate,
      target_daily_hours: profile.targetDailyHours,
      timezone: profile.timezone,
      time_format: profile.timeFormat,
    },
    created_at: profile.createdAt,
  };

  const session = {
    access_token: 'local-token',
    user,
  };

  const signOut = async () => {
    // Reset to default local profile
    const fresh = { ...DEFAULT_PROFILE, id: 'local_study_user' };
    setProfile(fresh);
    await localStore.set('user_profile', fresh);
  };

  const openProfileModal = () => setIsProfileModalOpen(true);
  const openAuthModal = () => setIsProfileModalOpen(true);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading: false,
        isAuthModalOpen: false,
        setIsAuthModalOpen: () => {},
        authModalMode: 'signin',
        setAuthModalMode: () => {},
        isProfileModalOpen,
        setIsProfileModalOpen,
        signUp: async () => ({ error: null }),
        signIn: async () => ({ error: null }),
        signInWithGoogle: async () => ({ error: null }),
        requestPasswordReset: async () => ({ error: null }),
        signOut,
        updateProfile,
        openAuthModal,
        openProfileModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
