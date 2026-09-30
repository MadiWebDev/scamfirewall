import { Redirect } from 'expo-router';
import { useAuthStore, useIsReady } from '@/stores/authStore';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  const { isReady, shouldShowOnboarding } = useIsReady();

  if (!isReady) {
    return null; // Splash screen will show
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (shouldShowOnboarding) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(app)/home" />;
}
