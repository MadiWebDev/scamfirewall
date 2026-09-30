import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const { isLoading, setLoading } = useAuthStore();

  useEffect(() => {
    // Check for stored auth on mount
    const initAuth = async () => {
      // The store will auto-hydrate from AsyncStorage
      setLoading(false);
    };

    initAuth();
  }, []);

  if (isLoading) {
    return null; // Or return a splash screen
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="check" options={{ presentation: 'modal' }} />
          <Stack.Screen name="result" options={{ presentation: 'modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
