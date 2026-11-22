import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { VictimDashboardScreen } from '../screens/VictimDashboardScreen';
import { SafeDashboardScreen } from '../screens/SafeDashboardScreen';
import { SurvivalGuideScreen } from '../screens/SurvivalGuideScreen';
import { BriefingScreen } from '../screens/onboarding/BriefingScreen';
import { ProfileScreen } from '../screens/onboarding/ProfileScreen';
import { ContactsScreen } from '../screens/onboarding/ContactsScreen';
import { PermissionsScreen } from '../screens/onboarding/PermissionsScreen';
import { BrandSplash } from '../components/common/BrandSplash';
import { useAppStore } from '../stores/useAppStore';
import { useProfileStore } from '../stores/useProfileStore';
import { getThemeColors } from '../theme/colors';
import { palette } from '../theme/emergency';

export type RootStackParamList = {
  // Onboarding (shown until onboardingCompleted)
  Briefing: undefined;
  Profile: undefined;
  Contacts: undefined;
  Permissions: undefined;
  // Main app (Phase 2 replaces Home with the Mode Selection Hub)
  Home: undefined;
  VictimDashboard: undefined;
  SafeDashboard: undefined;
  SurvivalGuide: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/** If AsyncStorage never reports hydration, continue with defaults after this long. */
const HYDRATION_TIMEOUT_MS = 3000;

export const RootNavigator: React.FC = () => {
  const theme = useAppStore((state) => state.theme);
  const appHydrated = useAppStore((state) => state.hasHydrated);
  const profileHydrated = useProfileStore((state) => state.hasHydrated);
  const onboardingCompleted = useProfileStore((state) => state.onboardingCompleted);
  const briefingSeen = useProfileStore((state) => state.briefingSeen);
  const colors = getThemeColors(theme);

  const [hydrationTimedOut, setHydrationTimedOut] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const ready = (appHydrated && profileHydrated) || hydrationTimedOut;

  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setHydrationTimedOut(true), HYDRATION_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [ready]);

  // Brand splash holds for its fixed ~1.2 s and keeps showing until storage has
  // hydrated, so the user never sees a flash of the wrong screen.
  if (!ready || !splashDone) {
    return <BrandSplash onMinElapsed={() => setSplashDone(true)} />;
  }

  const customNavigationTheme = {
    ...(theme === 'light' ? DefaultTheme : DarkTheme),
    colors: {
      ...(theme === 'light' ? DefaultTheme.colors : DarkTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.cardBorder,
      primary: colors.accentRed,
    },
  };

  return (
    <NavigationContainer theme={customNavigationTheme}>
      {onboardingCompleted ? (
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="VictimDashboard"
            component={VictimDashboardScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="SafeDashboard" component={SafeDashboardScreen} />
          <Stack.Screen name="SurvivalGuide" component={SurvivalGuideScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          // A user who quit mid-flow resumes at Profile instead of re-reading the briefing.
          initialRouteName={briefingSeen ? 'Profile' : 'Briefing'}
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: palette.bg },
          }}
        >
          <Stack.Screen name="Briefing" component={BriefingScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Contacts" component={ContactsScreen} />
          <Stack.Screen name="Permissions" component={PermissionsScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};
