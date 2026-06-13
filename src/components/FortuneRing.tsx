import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, FontSize } from '../theme';

interface Props {
  score: number;
  size?: number;
}

/**
 * Five-element ring visualization: colored outer ring with score in center.
 * Uses layered colored borders to approximate the five-element conic ring from the prototype.
 */
export default function FortuneRing({ score, size = 104 }: Props) {
  const outerSize = size;
  const ringWidth = Math.round(size * 0.05);
  const middleSize = outerSize - ringWidth * 2;
  const innerSize = middleSize - ringWidth;

  return (
    <View style={[styles.container, { width: outerSize, height: outerSize, borderRadius: outerSize / 2 }]}>
      {/* Outer ring - wood (top) */}
      <View style={[
        styles.ringLayer,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
          borderWidth: ringWidth,
          borderColor: Colors.wood,
          borderTopColor: Colors.wood,
          borderRightColor: Colors.fire,
          borderBottomColor: Colors.water,
          borderLeftColor: Colors.gold,
        },
      ]}>
        {/* Inner white ring */}
        <View style={[
          styles.innerRing,
          {
            width: middleSize,
            height: middleSize,
            borderRadius: middleSize / 2,
            borderWidth: 1,
            borderColor: 'rgba(255, 250, 241, 0.7)',
            backgroundColor: Colors.white,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}>
          {/* Score circle */}
          <View style={[
            styles.scoreCircle,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}>
            <Text style={[styles.scoreNumber, { fontSize: size * 0.24 }]}>{score}</Text>
            <Text style={styles.scoreLabel}>指数</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  ringLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircle: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontWeight: '800',
    color: Colors.ink,
  },
  scoreLabel: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    marginTop: -2,
  },
});
