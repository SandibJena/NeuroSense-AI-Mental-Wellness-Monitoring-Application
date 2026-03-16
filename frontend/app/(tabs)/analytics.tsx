/**
 * Analytics Screen – Detailed physiological and mental health analytics.
 * Shows HRV graph, sleep graph, stress trend chart, and mood timeline.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Line, Circle, Path, G, Text as SvgText } from 'react-native-svg';
import theme from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 160;

// Mock analytics data
const MOCK_ANALYTICS = {
  stressTrend: [
    { date: 'Mon', value: 35 },
    { date: 'Tue', value: 52 },
    { date: 'Wed', value: 45 },
    { date: 'Thu', value: 68 },
    { date: 'Fri', value: 42 },
    { date: 'Sat', value: 30 },
    { date: 'Sun', value: 38 },
  ],
  hrvTrend: [
    { date: 'Mon', value: 72 },
    { date: 'Tue', value: 58 },
    { date: 'Wed', value: 65 },
    { date: 'Thu', value: 45 },
    { date: 'Fri', value: 68 },
    { date: 'Sat', value: 78 },
    { date: 'Sun', value: 70 },
  ],
  sleepTrend: [
    { date: 'Mon', value: 7.5 },
    { date: 'Tue', value: 6.2 },
    { date: 'Wed', value: 7.8 },
    { date: 'Thu', value: 5.5 },
    { date: 'Fri', value: 8.1 },
    { date: 'Sat', value: 8.5 },
    { date: 'Sun', value: 7.0 },
  ],
  activityTrend: [
    { date: 'Mon', value: 8500 },
    { date: 'Tue', value: 6200 },
    { date: 'Wed', value: 11000 },
    { date: 'Thu', value: 4500 },
    { date: 'Fri', value: 7800 },
    { date: 'Sat', value: 12000 },
    { date: 'Sun', value: 5500 },
  ],
};

type DateRange = '7d' | '14d' | '30d';

// ============ Bar Chart Component ============
function BarChart({
  data,
  color,
  maxValue,
}: {
  data: { date: string; value: number }[];
  color: string;
  maxValue?: number;
}) {
  const max = maxValue || Math.max(...data.map((d) => d.value));
  const barWidth = (CHART_WIDTH - 40) / data.length - 8;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30}>
      {data.map((item, i) => {
        const barHeight = (item.value / max) * CHART_HEIGHT;
        const x = 30 + i * ((CHART_WIDTH - 40) / data.length) + 4;
        const y = CHART_HEIGHT - barHeight;

        return (
          <G key={i}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={color}
              opacity={0.8}
            />
            <SvgText
              x={x + barWidth / 2}
              y={CHART_HEIGHT + 16}
              textAnchor="middle"
              fontSize={10}
              fill={theme.colors.onSurfaceVariant}
            >
              {item.date}
            </SvgText>
            <SvgText
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize={9}
              fill={theme.colors.onSurface}
            >
              {typeof item.value === 'number' && item.value >= 1000
                ? `${(item.value / 1000).toFixed(1)}k`
                : item.value}
            </SvgText>
          </G>
        );
      })}
      {/* Horizontal grid lines */}
      {[0.25, 0.5, 0.75].map((pct, i) => (
        <Line
          key={i}
          x1={25}
          y1={CHART_HEIGHT * (1 - pct)}
          x2={CHART_WIDTH}
          y2={CHART_HEIGHT * (1 - pct)}
          stroke={theme.colors.outline}
          strokeWidth={0.5}
          strokeDasharray="4,4"
        />
      ))}
    </Svg>
  );
}

// ============ Line Chart Component ============
function LineChart({
  data,
  color,
  fillColor,
}: {
  data: { date: string; value: number }[];
  color: string;
  fillColor?: string;
}) {
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const padding = 30;

  const points = data.map((item, i) => ({
    x: padding + (i / (data.length - 1)) * (CHART_WIDTH - padding * 2),
    y: 10 + ((max - item.value) / range) * (CHART_HEIGHT - 20),
  }));

  const linePath = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${CHART_HEIGHT} L${points[0].x},${CHART_HEIGHT} Z`;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30}>
      {/* Area fill */}
      {fillColor && <Path d={areaPath} fill={fillColor} opacity={0.15} />}
      {/* Line */}
      <Path d={linePath} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Data points */}
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={4} fill={color} stroke={theme.colors.cardBackground} strokeWidth={2} />
      ))}
      {/* Labels */}
      {data.map((item, i) => (
        <SvgText
          key={i}
          x={points[i].x}
          y={CHART_HEIGHT + 16}
          textAnchor="middle"
          fontSize={10}
          fill={theme.colors.onSurfaceVariant}
        >
          {item.date}
        </SvgText>
      ))}
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((pct, i) => (
        <Line
          key={i}
          x1={padding}
          y1={10 + (CHART_HEIGHT - 20) * pct}
          x2={CHART_WIDTH - padding}
          y2={10 + (CHART_HEIGHT - 20) * pct}
          stroke={theme.colors.outline}
          strokeWidth={0.5}
          strokeDasharray="4,4"
        />
      ))}
    </Svg>
  );
}

// ============ Analytics Screen ============
export default function AnalyticsScreen() {
  const [dateRange, setDateRange] = useState<DateRange>('7d');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Date Range Filter */}
      <View style={styles.filterRow}>
        {(['7d', '14d', '30d'] as DateRange[]).map((range) => (
          <TouchableOpacity
            key={range}
            style={[styles.filterBtn, dateRange === range && styles.filterBtnActive]}
            onPress={() => setDateRange(range)}
          >
            <Text
              style={[styles.filterText, dateRange === range && styles.filterTextActive]}
            >
              {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : '30 Days'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stress Trend */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="flash" size={20} color={theme.colors.warning} />
          <Text style={styles.cardTitle}> Stress Trend</Text>
        </View>
        <BarChart data={MOCK_ANALYTICS.stressTrend} color={theme.colors.warning} maxValue={100} />
      </View>

      {/* HRV Trend */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="pulse" size={20} color={theme.colors.primary} />
          <Text style={styles.cardTitle}> Heart Rate Variability</Text>
        </View>
        <LineChart
          data={MOCK_ANALYTICS.hrvTrend}
          color={theme.colors.primary}
          fillColor={theme.colors.primary}
        />
      </View>

      {/* Sleep Trend */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="moon" size={20} color={theme.colors.secondary} />
          <Text style={styles.cardTitle}> Sleep Duration</Text>
        </View>
        <BarChart data={MOCK_ANALYTICS.sleepTrend} color={theme.colors.secondary} maxValue={10} />
      </View>

      {/* Activity Trend */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="footsteps" size={20} color={theme.colors.info} />
          <Text style={styles.cardTitle}> Daily Steps</Text>
        </View>
        <LineChart
          data={MOCK_ANALYTICS.activityTrend}
          color={theme.colors.info}
          fillColor={theme.colors.info}
        />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

// ============ Styles ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  filterBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    ...theme.typography.labelLarge,
    color: theme.colors.onSurfaceVariant,
  },
  filterTextActive: {
    color: theme.colors.onPrimary,
  },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.onSurface,
  },
});
