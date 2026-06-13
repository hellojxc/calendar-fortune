import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import TodayStackNavigator from './TodayStackNavigator';
import CalendarStackNavigator from './CalendarStackNavigator';
import FortuneStackNavigator from './FortuneStackNavigator';
import MeStackNavigator from './MeStackNavigator';
import { Colors } from '../theme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  TodayTab: { active: 'today', inactive: 'today-outline' },
  Calendar: { active: 'calendar', inactive: 'calendar-outline' },
  FortuneTab: { active: 'sparkles', inactive: 'sparkles-outline' },
  MeTab: { active: 'person', inactive: 'person-outline' },
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const icons = ICONS[route.name] ?? ICONS.Today;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[styles.tab, isFocused && styles.tabActive]}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFocused ? icons.active : icons.inactive}
              size={22}
              color={isFocused ? Colors.fire : Colors.muted}
            />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="TodayTab"
        component={TodayStackNavigator}
        options={{ tabBarLabel: '今日' }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarStackNavigator}
        options={{ tabBarLabel: '日历' }}
      />
      <Tab.Screen
        name="FortuneTab"
        component={FortuneStackNavigator}
        options={{ tabBarLabel: '运势' }}
      />
      <Tab.Screen
        name="MeTab"
        component={MeStackNavigator}
        options={{ tabBarLabel: '我的' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 72,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(223, 209, 189, 0.8)',
    backgroundColor: 'rgba(255, 250, 241, 0.94)',
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 3,
  },
  tabActive: {
    backgroundColor: Colors.fireSoft,
  },
  tabLabel: { fontSize: 12, color: Colors.muted },
  tabLabelActive: { color: Colors.fire, fontWeight: '600' },
});
