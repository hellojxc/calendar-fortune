import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CalendarScreen from '../screens/CalendarScreen';
import AddScheduleScreen from '../screens/AddScheduleScreen';

import type { AddScheduleParams } from './types';

export type CalendarStackParamList = {
  CalendarMain: undefined;
  AddSchedule: AddScheduleParams | undefined;
};

const Stack = createNativeStackNavigator<CalendarStackParamList>();

export default function CalendarStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CalendarMain" component={CalendarScreen} />
      <Stack.Screen name="AddSchedule" component={AddScheduleScreen} />
    </Stack.Navigator>
  );
}
