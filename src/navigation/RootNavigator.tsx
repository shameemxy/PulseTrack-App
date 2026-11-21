import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { VictimDashboardScreen } from '../screens/VictimDashboardScreen';
import { SafeDashboardScreen } from '../screens/SafeDashboardScreen';
import { SurvivalGuideScreen } from '../screens/SurvivalGuideScreen';
import { useAppStore } from '../stores/useAppStore';
import { getThemeColors } from '../theme/colors';

export type RootStackParamList = {
  Home: undefined;
  VictimDashboard: undefined;
  SafeDashboard: undefined;
  SurvivalGuide: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const theme = useAppStore((state) => state.theme);
  const colors = getThemeColors(theme);

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
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
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
    </NavigationContainer>
  );
};
