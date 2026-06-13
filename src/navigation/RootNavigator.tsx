import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import { isOnboardingDone } from '../storage/onboarding';

type RootParamList = {
  Onboarding: undefined;
  MainApp: undefined;
};

const Stack = createNativeStackNavigator<RootParamList>();

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f2e8' }}>
      <ActivityIndicator size="large" color="#2f7d63" />
    </View>
  );
}

export default function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'MainApp' | null>(null);

  useEffect(() => {
    (async () => {
      const done = await isOnboardingDone();
      setInitialRoute(done ? 'MainApp' : 'Onboarding');
    })();
  }, []);

  if (initialRoute === null) return <LoadingScreen />;

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="MainApp" component={TabNavigator} />
    </Stack.Navigator>
  );
}
