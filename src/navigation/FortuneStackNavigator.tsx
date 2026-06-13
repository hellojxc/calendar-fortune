import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FortuneScreen from '../screens/FortuneScreen';
import BirthDataScreen from '../screens/BirthDataScreen';
import type { FortuneStackParamList } from './types';

const Stack = createNativeStackNavigator<FortuneStackParamList>();

export default function FortuneStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FortuneMain" component={FortuneScreen} />
      <Stack.Screen name="BirthData" component={BirthDataScreen} />
    </Stack.Navigator>
  );
}
