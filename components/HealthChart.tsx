import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useThemeColors } from '@/stores/useThemeStore';

interface HealthDataPoint {
  value: number;
  date: string;
}

interface HealthChartProps {
  data: HealthDataPoint[];
  title: string;
  color: string;
  unit: string;
  height?: number;
}

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 40;

export default function HealthChart({
  data,
  title,
  color,
  unit,
  height = 200,
}: HealthChartProps) {
  const colors = useThemeColors();

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <View style={[styles.noDataContainer, { height }]}>
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            No data available
          </Text>
        </View>
      </View>
    );
  }

  const values = data.map(d => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * (CHART_WIDTH - 40) + 20;
    const y = height - 40 - ((value - minValue) / range) * (height - 80);
    return { x, y, value };
  });

  // Create smooth curve path
  let pathData = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + (curr.x - prev.x) / 3;
    const cpy1 = prev.y;
    const cpx2 = curr.x - (curr.x - prev.x) / 3;
    const cpy2 = curr.y;
    pathData += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  };

  const currentValue = values[values.length - 1];
  const previousValue = values[values.length - 2];
  const change = previousValue ? ((currentValue - previousValue) / previousValue) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <View style={styles.valueContainer}>
          <Text style={[styles.currentValue, { color }]}>
            {currentValue.toLocaleString()} {unit}
          </Text>
          {change !== 0 && (
            <Text style={[
              styles.changeText,
              { color: change >= 0 ? '#10B981' : '#EF4444' }
            ]}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </Text>
          )}
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={height}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <Line
              key={i}
              x1={20}
              y1={20 + (i * (height - 40) / 4)}
              x2={CHART_WIDTH - 20}
              y2={20 + (i * (height - 40) / 4)}
              stroke={colors.border}
              strokeWidth={1}
              opacity={0.3}
            />
          ))}
          
          {/* Chart line */}
          <Path
            d={pathData}
            stroke={color}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={color}
              stroke="white"
              strokeWidth={2}
            />
          ))}
          
          {/* Date labels - show only first, middle, and last */}
          {[0, Math.floor(data.length / 2), data.length - 1].map((index) => {
            if (index >= data.length) return null;
            const x = (index / (data.length - 1)) * (CHART_WIDTH - 40) + 20;
            
            return (
              <SvgText
                key={index}
                x={x}
                y={height - 10}
                fontSize={12}
                fill={colors.textSecondary}
                textAnchor="middle"
              >
                {formatDate(data[index].date)}
              </SvgText>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  currentValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  changeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  chartContainer: {
    alignItems: 'center',
  },
  noDataContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
});