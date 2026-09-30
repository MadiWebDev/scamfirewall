import { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Phone,
  Link,
  FileText,
  CreditCard,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/mockApi';
import { RiskLevel, EventChannel } from '@/types';

const riskConfig = {
  [RiskLevel.LOW]: {
    color: 'bg-green-500',
    textColor: 'text-green-700',
    icon: ShieldCheck,
    label: 'Protected',
  },
  [RiskLevel.MEDIUM]: {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    icon: Shield,
    label: 'Caution',
  },
  [RiskLevel.HIGH]: {
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    icon: ShieldAlert,
    label: 'At Risk',
  },
  [RiskLevel.CRITICAL]: {
    color: 'bg-red-600',
    textColor: 'text-red-700',
    icon: ShieldAlert,
    label: 'Critical',
  },
};

const channelIcons = {
  [EventChannel.SMS]: MessageSquare,
  [EventChannel.CALL]: Phone,
  [EventChannel.EMAIL]: MessageSquare,
  [EventChannel.LINK]: Link,
  [EventChannel.INVOICE]: FileText,
  [EventChannel.PAYMENT]: CreditCard,
};

export default function HomeScreen() {
  const { user } = useAuthStore();

  const {
    data: events,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['events', 'recent'],
    queryFn: () => api.check.getHistory(),
  });

  const recentEvents = events?.slice(0, 3) || [];
  const hasHighRisk = recentEvents.some(
    (e) => e.riskLevel === RiskLevel.HIGH || e.riskLevel === RiskLevel.CRITICAL
  );

  const currentRisk = hasHighRisk ? RiskLevel.HIGH : RiskLevel.LOW;
  const riskStatus = riskConfig[currentRisk];
  const RiskIcon = riskStatus.icon;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-6">
          <Text className="text-slate-500 text-sm">Welcome back</Text>
          <Text className="text-2xl font-bold text-slate-900 mt-1">
            {user?.fullName || 'User'}
          </Text>
        </View>

        {/* Protection Status Card */}
        <View className="mx-5 mb-6">
          <View className={`${riskStatus.color} rounded-2xl p-6`}>
            <View className="flex-row items-center">
              <View className="w-14 h-14 bg-white/20 rounded-full items-center justify-center">
                <RiskIcon size={28} color="white" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-white/80 text-sm">Protection Status</Text>
                <Text className="text-white text-2xl font-bold">{riskStatus.label}</Text>
              </View>
            </View>
            <Text className="text-white/90 mt-4 text-sm leading-5">
              {hasHighRisk
                ? 'Recent suspicious activity detected. Review your alerts below.'
                : 'Your accounts are being monitored. No immediate threats detected.'}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-5 mb-6">
          <Text className="text-lg font-semibold text-slate-900 mb-4">
            Quick Check
          </Text>
          <View className="flex-row flex-wrap -mx-1">
            {[
              { channel: EventChannel.SMS, label: 'Message', color: 'bg-blue-50' },
              { channel: EventChannel.CALL, label: 'Call', color: 'bg-green-50' },
              { channel: EventChannel.LINK, label: 'Link', color: 'bg-purple-50' },
              { channel: EventChannel.PAYMENT, label: 'Payment', color: 'bg-orange-50' },
            ].map((action) => (
              <TouchableOpacity
                key={action.channel}
                className="w-1/4 px-1 mb-2"
                onPress={() => router.push('/check')}
              >
                <View className={`${action.color} rounded-xl p-3 items-center`}>
                  <View className="w-10 h-10 bg-white rounded-lg items-center justify-center mb-2">
                    {(() => {
                      const Icon = channelIcons[action.channel] || MessageSquare;
                      return <Icon size={20} color="#2563EB" />;
                    })()}
                  </View>
                  <Text className="text-xs font-medium text-slate-700">
                    {action.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-slate-900">
              Recent Activity
            </Text>
            <TouchableOpacity onPress={() => router.push('/alerts')}>
              <Text className="text-blue-600 font-medium text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          {recentEvents.length === 0 ? (
            <View className="bg-white rounded-xl p-6 items-center">
              <ShieldCheck size={48} color="#22C55E" />
              <Text className="text-slate-900 font-medium mt-3">No recent checks</Text>
              <Text className="text-slate-500 text-sm mt-1 text-center">
                Your recent scam checks will appear here
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {recentEvents.map((event) => {
                const Icon = channelIcons[event.channel] || MessageSquare;
                const risk = event.riskLevel || RiskLevel.LOW;
                const riskStyle =
                  risk === RiskLevel.CRITICAL
                    ? 'bg-red-50 border-red-200'
                    : risk === RiskLevel.HIGH
                    ? 'bg-orange-50 border-orange-200'
                    : risk === RiskLevel.MEDIUM
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-green-50 border-green-200';

                return (
                  <TouchableOpacity
                    key={event.id}
                    className={`${riskStyle} border rounded-xl p-4`}
                  >
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-white rounded-lg items-center justify-center">
                        <Icon size={20} color="#64748B" />
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="font-medium text-slate-900 capitalize">
                          {event.channel.toLowerCase()} Check
                        </Text>
                        <Text className="text-slate-500 text-sm" numberOfLines={1}>
                          {event.redactedSummary || 'No summary available'}
                        </Text>
                      </View>
                      <ChevronRight size={20} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Family Status */}
        <View className="px-5 mt-6 mb-8">
          <TouchableOpacity
            className="bg-white rounded-xl p-4 border border-slate-200"
            onPress={() => router.push('/family')}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-blue-100 rounded-lg items-center justify-center">
                <Users size={20} color="#2563EB" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-medium text-slate-900">Family Protection</Text>
                <Text className="text-slate-500 text-sm">
                  2 family members protected
                </Text>
              </View>
              <ChevronRight size={20} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Need to import Users icon
import { Users } from 'lucide-react-native';
