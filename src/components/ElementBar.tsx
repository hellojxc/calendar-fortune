import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../theme';

interface Props {
  label: string;
  value: number;
  color?: string;
  maxValue?: number;
}

/**
 * Horizontal bar showing an element's strength (木火土金水).
 */
export default function ElementBar({ label, value, color = Colors.wood, maxValue = 100 }: Props) {
  const pct = Math.min((value / maxValue) * 100, 100);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  label: {
    width: 34,
    fontSize: 12,
    color: Colors.ink,
    textAlign: 'center',
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(117, 109, 97, 0.14)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  value: {
    width: 34,
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'right',
    fontWeight: '600',
  },
});
