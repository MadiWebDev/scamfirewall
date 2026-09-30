# Scam Firewall Mobile App

A React Native + Expo mobile application for real-time scam protection.

## Features

- **Real-time Scam Detection**: Check suspicious messages, calls, links, and payments
- **Risk Analysis**: Get clear explanations of why something might be a scam
- **Family Protection**: Set up trusted contacts for escalation
- **Recovery Support**: Step-by-step guidance if you've been scammed
- **Elder Mode**: Simplified interface for older adults

## Tech Stack

- React Native with Expo
- TypeScript
- Expo Router for navigation
- TanStack Query for data fetching
- Zustand for state management
- NativeWind for styling (Tailwind CSS)
- Zod for validation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator

### Installation

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API endpoint
```

3. Start the development server:
```bash
npm start
```

4. Run on device/simulator:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

### Environment Variables

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_USE_MOCK_API=true  # Set to false to use real backend
```

## Project Structure

```
app/                    # Expo Router screens
  (auth)/              # Authentication routes
    login.tsx
    register.tsx
    onboarding.tsx
  (app)/               # Main app routes (tab navigation)
    home.tsx
    check.tsx
    alerts.tsx
    family.tsx
    settings.tsx
  _layout.tsx          # Root layout
  index.tsx            # Entry point
  result.tsx           # Analysis result screen

components/            # Reusable components
  ui/                 # UI primitives

hooks/                # Custom React hooks

services/             # API services
  api.ts             # Real API client
  mockApi.ts         # Mock API for development

stores/               # Zustand state stores
  authStore.ts
  checkStore.ts

types/                # TypeScript types
  index.ts

utils/                # Utility functions
```

## Key User Flows

### 1. Check a Suspicious Message
1. Tap "Check" tab or quick action on home
2. Select message type (SMS, Call, Link, Payment)
3. Paste text or upload screenshot
4. Tap "Check Now"
5. Review analysis result with risk level and recommendations

### 2. Family Escalation
1. From result screen with high/critical risk
2. Tap "Alert Trusted Contact"
3. Confirmation sent to family member

### 3. Recovery Mode
1. Go to Settings → Recovery
2. View incident-specific recovery checklist
3. Complete tasks to secure accounts

## Development Notes

### Using Mock API
Set `EXPO_PUBLIC_USE_MOCK_API=true` to use mock data during development. This simulates API responses without needing the backend running.

### Adding New Screens
1. Create file in `app/` directory
2. Export default component
3. Use Expo Router for navigation

### Styling
Uses NativeWind (Tailwind CSS for React Native). Class names work like web Tailwind.

Example:
```tsx
<View className="flex-1 bg-slate-50 p-4">
  <Text className="text-lg font-bold text-slate-900">Title</Text>
</View>
```

## Building for Production

### iOS
```bash
npx expo prebuild --platform ios
cd ios
fastlane beta
```

### Android
```bash
npx expo prebuild --platform android
cd android
fastlane beta
```

Or use EAS Build:
```bash
npx eas build --platform ios
npx eas build --platform android
```

## License

Private - Scam Firewall Application
