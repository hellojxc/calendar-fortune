import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TodayScreen from '../screens/TodayScreen';
import AddScheduleScreen from '../screens/AddScheduleScreen';
import type { TodayStackParamList } from './types';

const Stack = createNativeStackNavigator<TodayStackParamList>();

export default function TodayStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TodayMain" component={TodayScreen} />
      <Stack.Screen name="AddSchedule" component={AddScheduleScreen} />
    </Stack.Navigator>
  );
}
