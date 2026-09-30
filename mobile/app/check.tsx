import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MessageSquare,
  Phone,
  Link,
  CreditCard,
  Camera,
  Image as ImageIcon,
  Send,
  X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useCheckStore, createCheckRequest } from '@/stores/checkStore';
import { api } from '@/services/mockApi';
import { EventChannel } from '@/types';

const checkTypes = [
  { id: EventChannel.SMS, label: 'Message', icon: MessageSquare, color: 'bg-blue-500' },
  { id: EventChannel.CALL, label: 'Call', icon: Phone, color: 'bg-green-500' },
  { id: EventChannel.LINK, label: 'Link', icon: Link, color: 'bg-purple-500' },
  { id: EventChannel.PAYMENT, label: 'Payment', icon: CreditCard, color: 'bg-orange-500' },
];

export default function CheckScreen() {
  const [selectedType, setSelectedType] = useState<EventChannel>(EventChannel.SMS);
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { setResult } = useCheckStore();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const handleCheck = async () => {
    if (!content && !image) {
      Alert.alert('Input needed', 'Please enter text or upload an image to check');
      return;
    }

    setIsAnalyzing(true);
    try {
      const request = createCheckRequest(selectedType, content || undefined, image || undefined);
      const result = await api.check.submitCheck({
        channel: request.channel,
        content: request.content,
      });
      
      setResult(result);
      router.push('/result');
    } catch (error) {
      Alert.alert(
        'Check failed',
        error instanceof Error ? error.message : 'Unable to analyze. Please try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedTypeConfig = checkTypes.find(t => t.id === selectedType);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-slate-200">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-slate-900 text-center mr-8">
          Check for Scams
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          {/* Type Selector */}
          <View className="px-4 py-4">
            <Text className="text-sm font-medium text-slate-700 mb-3">What would you like to check?</Text>
            <View className="flex-row flex-wrap -mx-1">
              {checkTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    className="w-1/4 px-1 mb-2"
                    onPress={() => setSelectedType(type.id)}
                  >
                    <View
                      className={`items-center p-3 rounded-xl ${
                        isSelected ? type.color : 'bg-white border border-slate-200'
                      }`}
                    >
                      <Icon size={24} color={isSelected ? 'white' : '#64748B'} />
                      <Text
                        className={`text-xs font-medium mt-1 ${
                          isSelected ? 'text-white' : 'text-slate-600'
                        }`}
                      >
                        {type.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Input Area */}
          <View className="px-4">
            <View className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Image Preview */}
              {image && (
                <View className="relative">
                  <Image source={{ uri: image }} className="w-full h-48" resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => setImage(null)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full items-center justify-center"
                  >
                    <X size={18} color="white" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Text Input */}
              <TextInput
                className="p-4 min-h-[120] text-slate-900"
                placeholder={
                  selectedType === EventChannel.SMS
                    ? 'Paste suspicious message text here...'
                    : selectedType === EventChannel.CALL
                    ? 'Enter caller details or what they said...'
                    : selectedType === EventChannel.LINK
                    ? 'Paste the suspicious URL here...'
                    : 'Describe the payment request or invoice...'
                }
                placeholderTextColor="#94A3B8"
                multiline
                value={content}
                onChangeText={setContent}
                editable={!isAnalyzing}
              />

              {/* Attachment Buttons */}
              <View className="flex-row items-center px-4 pb-3 border-t border-slate-100 pt-2">
                <TouchableOpacity
                  onPress={takePhoto}
                  disabled={isAnalyzing}
                  className="flex-row items-center mr-4"
                >
                  <Camera size={20} color="#64748B" />
                  <Text className="text-sm text-slate-600 ml-1.5">Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={pickImage}
                  disabled={isAnalyzing}
                  className="flex-row items-center"
                >
                  <ImageIcon size={20} color="#64748B" />
                  <Text className="text-sm text-slate-600 ml-1.5">Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Help Text */}
          <View className="px-4 mt-4">
            <View className="bg-blue-50 rounded-lg p-4">
              <Text className="text-sm text-blue-800 leading-5">
                {selectedType === EventChannel.SMS &&
                  'Copy and paste suspicious text messages, WhatsApp messages, or emails here.'}
                {selectedType === EventChannel.CALL &&
                  'Describe who called you, what number they used, and what they asked for.'}
                {selectedType === EventChannel.LINK &&
                  'Paste any suspicious links you received via message or email.'}
                {selectedType === EventChannel.PAYMENT &&
                  'Upload payment requests, invoices, or QR codes you are unsure about.'}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View className="px-4 py-4 bg-white border-t border-slate-200">
          <TouchableOpacity
            onPress={handleCheck}
            disabled={isAnalyzing || (!content && !image)}
            className={`${selectedTypeConfig?.color || 'bg-blue-600'} h-14 rounded-xl items-center justify-center flex-row ${
              (isAnalyzing || (!content && !image)) ? 'opacity-70' : ''
            }`}
          >
            {isAnalyzing ? (
              <>
                <ActivityIndicator color="white" className="mr-2" />
                <Text className="text-white font-semibold text-lg">Analyzing...</Text>
              </>
            ) : (
              <>
                <Send size={20} color="white" className="mr-2" />
                <Text className="text-white font-semibold text-lg">Check Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
