import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { AuthError, Session, User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string | undefined;
  name: string | null;
  avatar_url?: string | null;
  role?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error: AuthError | null }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error: AuthError | null }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: AuthError | null }>;
  updateProfile: (data: { name?: string; avatar_url?: string }) => Promise<{ success: boolean; error: AuthError | null }>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Convert Supabase user to our User type
const formatUser = (user: SupabaseUser): User => {
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email?.split('@')[0] || null,
    avatar_url: user.user_metadata?.avatar_url,
    role: user.user_metadata?.role
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for session on initial load
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session?.user) {
        setUser(formatUser(session.user));
      }
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_, newSession) => {
          setSession(newSession);
          if (newSession?.user) {
            setUser(formatUser(newSession.user));
          } else {
            setUser(null);
          }
        }
      );
      
      setIsLoading(false);
      
      return () => {
        subscription.unsubscribe();
      };
    };
    
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      return { 
        success: !error && !!data.session, 
        error 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error as AuthError 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'customer' // Default role for new users
          }
        }
      });
      
      return { 
        success: !error && !!data.user, 
        error 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error as AuthError 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      return { 
        success: !error, 
        error 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error as AuthError 
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateProfile = async (data: { name?: string; avatar_url?: string }) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data
      });
      
      if (!error && user) {
        setUser({
          ...user,
          name: data.name || user.name,
          avatar_url: data.avatar_url || user.avatar_url
        });
      }
      
      return { 
        success: !error, 
        error 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error as AuthError 
      };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      login,
      register,
      logout,
      resetPassword,
      updateProfile,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};