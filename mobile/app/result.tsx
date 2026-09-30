import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ShieldAlert,
  Shield,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Share2,
  Users,
  FileText,
  ExternalLink,
} from 'lucide-react-native';
import { useCheckStore } from '@/stores/checkStore';
import { RiskLevel, InterventionAction } from '@/types';

const riskConfig = {
  [RiskLevel.LOW]: {
    color: 'bg-green-500',
    textColor: 'text-green-700',
    icon: CheckCircle,
    title: 'Looks Safe',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  [RiskLevel.MEDIUM]: {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    icon: AlertCircle,
    title: 'Be Cautious',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  [RiskLevel.HIGH]: {
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    icon: ShieldAlert,
    title: 'High Risk',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  [RiskLevel.CRITICAL]: {
    color: 'bg-red-600',
    textColor: 'text-red-700',
    icon: AlertTriangle,
    title: 'CRITICAL - Likely Scam',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

export default function ResultScreen() {
  const { currentResult, reset } = useCheckStore();

  if (!currentResult) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <Text className="text-slate-500">No result available</Text>
        <TouchableOpacity onPress={() => router.replace('/check')} className="mt-4">
          <Text className="text-blue-600 font-medium">Start a new check</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { intervention, riskLevel, signals } = currentResult;
  const config = riskConfig[riskLevel];
  const RiskIcon = config.icon;

  const isHighRisk = riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL;

  const handleEscalate = () => {
    Alert.alert(
      'Alert Trusted Contact',
      'This will notify your trusted contact about this potential scam.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Alert Sent', 'Your trusted contact has been notified.');
          },
        },
      ]
    );
  };

  const handleDone = () => {
    reset();
    router.replace('/(app)/home');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-slate-200">
        <TouchableOpacity onPress={handleDone} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-slate-900 text-center mr-8">
          Analysis Result
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* Risk Banner */}
        <View className={`${config.bgColor} ${config.borderColor} border-b px-5 py-6`}>
          <View className="flex-row items-center">
            <View className={`${config.color} w-16 h-16 rounded-full items-center justify-center`}>
              <RiskIcon size={32} color="white" />
            </View>
            <View className="ml-4 flex-1">
              <Text className={`${config.textColor} font-semibold text-lg`}>
                {config.title}
              </Text>
              <Text className="text-slate-700 mt-1 leading-5">
                {intervention.headline}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View className="px-5 py-4">
          {/* Why It Was Flagged */}
          {intervention.reasons.length > 0 && (
            <View className="bg-white rounded-xl p-4 mb-4 border border-slate-200">
              <Text className="font-semibold text-slate-900 mb-3">Why this was flagged:</Text>
              {intervention.reasons.map((reason, index) => (
                <View key={reason.code} className="flex-row items-start mb-2 last:mb-0">
                  <View className="w-6 h-6 bg-red-100 rounded-full items-center justify-center mr-2 mt-0.5">
                    <Text className="text-red-600 text-xs font-bold">{index + 1}</Text>
                  </View>
                  <Text className="flex-1 text-slate-700 leading-5">{reason.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* DO NOT DO Section - Critical for high risk */}
          {isHighRisk && intervention.doNotDo.length > 0 && (
            <View className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200">
              <View className="flex-row items-center mb-3">
                <AlertTriangle size={20} color="#DC2626" />
                <Text className="font-semibold text-red-800 ml-2">DO NOT:</Text>
              </View>
              {intervention.doNotDo.map((item, index) => (
                <View key={index} className="flex-row items-start mb-2 last:mb-0">
                  <Text className="text-red-600 font-bold mr-2">-</Text>
                  <Text className="flex-1 text-red-700 leading-5">{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Safest Next Steps */}
          {intervention.safestNext.length > 0 && (
            <View className="bg-green-50 rounded-xl p-4 mb-4 border border-green-200">
              <Text className="font-semibold text-green-800 mb-3">Safest next steps:</Text>
              {intervention.safestNext.map((step, index) => (
                <View key={index} className="flex-row items-start mb-2 last:mb-0">
                  <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center mr-2 mt-0.5">
                    <Text className="text-white text-xs font-bold">{index + 1}</Text>
                  </View>
                  <Text className="flex-1 text-green-800 leading-5">{step}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Verify Through */}
          {intervention.verifyVia.length > 0 && (
            <View className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
              <Text className="font-semibold text-blue-800 mb-3">Verify through official channels:</Text>
              {intervention.verifyVia.map((channel, index) => (
                <View key={index} className="flex-row items-center mb-2 last:mb-0">
                  <ExternalLink size={16} color="#2563EB" className="mr-2" />
                  <Text className="flex-1 text-blue-700">{channel}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Signals Detail */}
          {signals.length > 0 && (
            <View className="bg-white rounded-xl p-4 mb-4 border border-slate-200">
              <Text className="font-semibold text-slate-900 mb-3">Technical signals detected:</Text>
              {signals.map((signal) => (
                <View key={signal.id} className="mb-3 last:mb-0 pb-3 last:pb-0 border-b last:border-0 border-slate-100">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="font-medium text-slate-800">{signal.label}</Text>
                    <View className={`px-2 py-1 rounded ${
                      signal.confidence > 0.8 ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      <Text className={`text-xs ${
                        signal.confidence > 0.8 ? 'text-red-700' : 'text-yellow-700'
                      }`}>
                        {Math.round(signal.confidence * 100)}% confidence
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm text-slate-600">{signal.description}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Uncertainty Note */}
          {intervention.uncertainty && (
            <View className="bg-slate-100 rounded-xl p-4 mb-4">
              <Text className="text-sm text-slate-600 italic">{intervention.uncertainty}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="px-5 py-4 bg-white border-t border-slate-200">
        {isHighRisk && (
          <TouchableOpacity
            onPress={handleEscalate}
            className="bg-slate-900 h-14 rounded-xl items-center justify-center flex-row mb-3"
          >
            <Users size={20} color="white" className="mr-2" />
            <Text className="text-white font-semibold text-lg">Alert Trusted Contact</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleDone}
          className={`${isHighRisk ? 'bg-white border-2 border-slate-200' : config.color} h-14 rounded-xl items-center justify-center`}
        >
          <Text className={`font-semibold text-lg ${isHighRisk ? 'text-slate-900' : 'text-white'}`}>
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
