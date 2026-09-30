import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '@/types';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingComplete: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setOnboardingComplete: (complete: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      onboardingComplete: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setToken: (token) => set({ token }),
      
      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
      
      login: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      }),
      
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        onboardingComplete: false,
      }),
      
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        onboardingComplete: state.onboardingComplete,
      }),
    }
  )
);

// Helper hook for protected routes
export const useIsReady = () => {
  const { isLoading, isAuthenticated, onboardingComplete } = useAuthStore();
  return {
    isReady: !isLoading,
    shouldShowOnboarding: isAuthenticated && !onboardingComplete,
  };
};
