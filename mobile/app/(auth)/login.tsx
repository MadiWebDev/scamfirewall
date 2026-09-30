import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/mockApi';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.auth.login(email, password);
      login(response.user, response.accessToken);
      router.replace('/(app)/home');
    } catch (error) {
      Alert.alert(
        'Login Failed',
        error instanceof Error ? error.message : 'Invalid credentials'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-blue-600 rounded-2xl items-center justify-center mb-4">
              <Shield size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-slate-900">Scam Firewall</Text>
            <Text className="text-slate-600 mt-2 text-center">
              Protect yourself from scams before you lose money
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            {/* Email */}
            <View>
              <Text className="text-sm font-medium text-slate-700 mb-1.5">Email</Text>
              <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-12">
                <Mail size={20} color="#64748B" />
                <TextInput
                  className="flex-1 ml-3 text-slate-900"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password */}
            <View>
              <Text className="text-sm font-medium text-slate-700 mb-1.5">Password</Text>
              <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-12">
                <Lock size={20} color="#64748B" />
                <TextInput
                  className="flex-1 ml-3 text-slate-900"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#64748B" />
                  ) : (
                    <Eye size={20} color="#64748B" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity className="self-end">
              <Text className="text-blue-600 font-medium">Forgot password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className={`bg-blue-600 h-14 rounded-xl items-center justify-center mt-4 ${
                isLoading ? 'opacity-70' : ''
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-lg">Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Demo hint */}
            <Text className="text-center text-slate-500 text-sm mt-4">
              Demo: demo@scamfirewall.app / password
            </Text>
          </View>

          {/* Register Link */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-slate-600">Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity disabled={isLoading}>
                <Text className="text-blue-600 font-semibold">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
