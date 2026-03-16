/**
 * Dashboard Screen – Main wellness overview
 * Shows stress gauge, recovery score, burnout risk, sleep & activity summary.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop, Path, G, Text as SvgText } from 'react-native-svg';
import theme from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ Mock Data (used until backend is connected) ============
const MOCK_DATA = {
  stressScore: 42,
  recoveryScore: 78,
  burnoutRisk: 0.23,
  sleepHours: 7.2,
  sleepQuality: 82,
  heartRate: 68,
  hrv: 62,
  steps: 8450,
  activityLevel: 65,
  recommendations: [
    'Your stress levels are moderate. Stay mindful of your body\'s signals.',
    'Good sleep last night! Aim for consistency.',
    'Try a 10-minute meditation to lower stress further.',
  ],
  stressTrend: [35, 42, 55, 48, 38, 42, 42],
};

// ============ Stress Gauge Component ============
function StressGauge({ score }: { score: number }) {
  const radius = 80;
  const strokeWidth = 12;
  const center = radius + strokeWidth;
  const circumference = Math.PI * radius; // Semi-circle
  const progress = (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s <= 30) return theme.colors.stressLow;
    if (s <= 60) return theme.colors.stressMedium;
    if (s <= 80) return theme.colors.stressHigh;
    return theme.colors.stressCritical;
  };

  const getLabel = (s: number) => {
    if (s <= 30) return 'Low';
    if (s <= 60) return 'Moderate';
    if (s <= 80) return 'High';
    return 'Critical';
  };

  return (
    <View style={styles.gaugeContainer}>
      <Svg
        width={center * 2}
        height={center + 20}
        viewBox={`0 0 ${center * 2} ${center + 20}`}
      >
        <Defs>
          <LinearGradient id="stressGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={theme.colors.stressLow} />
            <Stop offset="0.5" stopColor={theme.colors.stressMedium} />
            <Stop offset="1" stopColor={theme.colors.stressCritical} />
          </LinearGradient>
        </Defs>
        {/* Background arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.colors.surfaceVariant}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(180 ${center} ${center})`}
        />
        {/* Progress arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          transform={`rotate(180 ${center} ${center})`}
        />
        <SvgText
          x={center}
          y={center - 10}
          textAnchor="middle"
          fontSize={42}
          fontWeight="bold"
          fill={theme.colors.onBackground}
        >
          {score}
        </SvgText>
        <SvgText
          x={center}
          y={center + 18}
          textAnchor="middle"
          fontSize={14}
          fill={theme.colors.onSurfaceVariant}
        >
          {getLabel(score)}
        </SvgText>
      </Svg>
      <Text style={styles.gaugeTitle}>Stress Level</Text>
    </View>
  );
}

// ============ Recovery Meter Component ============
function RecoveryMeter({ score }: { score: number }) {
  const radius = 45;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return theme.colors.recoveryExcellent;
    if (s >= 60) return theme.colors.recoveryGood;
    if (s >= 40) return theme.colors.recoveryFair;
    return theme.colors.recoveryPoor;
  };

  return (
    <View style={styles.meterContainer}>
      <Svg width={120} height={120}>
        <Circle
          cx={60}
          cy={60}
          r={radius}
          stroke={theme.colors.surfaceVariant}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={60}
          cy={60}
          r={radius}
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <SvgText
          x={60}
          y={56}
          textAnchor="middle"
          fontSize={24}
          fontWeight="bold"
          fill={theme.colors.onBackground}
        >
          {score}
        </SvgText>
        <SvgText
          x={60}
          y={72}
          textAnchor="middle"
          fontSize={10}
          fill={theme.colors.onSurfaceVariant}
        >
          / 100
        </SvgText>
      </Svg>
    </View>
  );
}

// ============ Mini Trend Sparkline ============
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const width = 100;
  const height = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Svg width={width} height={height}>
      <Path
        d={`M ${points.split(' ').map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(' ')}`}
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
    </Svg>
  );
}

// ============ Metric Card ============
function MetricCard({
  icon,
  label,
  value,
  unit,
  color,
  trend,
}: {
  icon: string;
  label: string;
  value: string | number;
  unit: string;
  color: string;
  trend?: number[];
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <View style={styles.metricBody}>
        <View>
          <Text style={[styles.metricValue, { color }]}>{value}</Text>
          <Text style={styles.metricUnit}>{unit}</Text>
        </View>
        {trend && <Sparkline data={trend} color={color} />}
      </View>
    </View>
  );
}

// ============ Dashboard Screen ============
export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const data = MOCK_DATA;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning 👋</Text>
          <Text style={styles.subtitle}>Here's your wellness overview</Text>
        </View>
        <TouchableOpacity style={styles.notifButton}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Stress Gauge */}
      <View style={styles.card}>
        <StressGauge score={data.stressScore} />
      </View>

      {/* Recovery & Burnout Row */}
      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>Recovery</Text>
          <RecoveryMeter score={data.recoveryScore} />
          <Text style={[styles.statusText, { color: theme.colors.recoveryGood }]}>
            Good Recovery
          </Text>
        </View>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>Burnout Risk</Text>
          <View style={styles.burnoutCenter}>
            <Text style={styles.burnoutValue}>
              {Math.round(data.burnoutRisk * 100)}%
            </Text>
            <View style={styles.burnoutBar}>
              <View
                style={[
                  styles.burnoutFill,
                  {
                    width: `${data.burnoutRisk * 100}%`,
                    backgroundColor:
                      data.burnoutRisk < 0.3
                        ? theme.colors.success
                        : data.burnoutRisk < 0.6
                        ? theme.colors.warning
                        : theme.colors.error,
                  },
                ]}
              />
            </View>
            <Text style={styles.burnoutLabel}>
              {data.burnoutRisk < 0.3 ? 'Low Risk' : data.burnoutRisk < 0.6 ? 'Moderate' : 'High Risk'}
            </Text>
          </View>
        </View>
      </View>

      {/* Metrics Grid */}
      <View style={styles.row}>
        <MetricCard
          icon="heart"
          label="Heart Rate"
          value={data.heartRate}
          unit="bpm"
          color={theme.colors.tertiary}
        />
        <MetricCard
          icon="pulse"
          label="HRV"
          value={data.hrv}
          unit="ms"
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.row}>
        <MetricCard
          icon="moon"
          label="Sleep"
          value={data.sleepHours}
          unit="hours"
          color={theme.colors.secondary}
        />
        <MetricCard
          icon="footsteps"
          label="Steps"
          value={data.steps.toLocaleString()}
          unit="steps"
          color={theme.colors.info}
        />
      </View>

      {/* Recommendations */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="bulb" size={20} color={theme.colors.warning} />
          <Text style={styles.cardTitle}> AI Insights</Text>
        </View>
        {data.recommendations.map((rec, i) => (
          <View key={i} style={styles.insightRow}>
            <View style={styles.insightDot} />
            <Text style={styles.insightText}>{rec}</Text>
          </View>
        ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  greeting: {
    ...theme.typography.headlineLarge,
    color: theme.colors.onBackground,
  },
  subtitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.md,
  },
  halfCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: theme.spacing.sm,
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
  gaugeContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  gaugeTitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.onSurfaceVariant,
    marginTop: -10,
  },
  meterContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },
  statusText: {
    ...theme.typography.labelLarge,
    textAlign: 'center',
  },
  burnoutCenter: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  burnoutValue: {
    ...theme.typography.displayMedium,
    color: theme.colors.onBackground,
  },
  burnoutBar: {
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 3,
    marginTop: theme.spacing.sm,
    overflow: 'hidden',
  },
  burnoutFill: {
    height: '100%',
    borderRadius: 3,
  },
  burnoutLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  metricLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginLeft: theme.spacing.xs,
  },
  metricBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  metricValue: {
    ...theme.typography.headlineLarge,
  },
  metricUnit: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
    paddingLeft: theme.spacing.xs,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginTop: 7,
    marginRight: theme.spacing.sm,
  },
  insightText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurface,
    flex: 1,
  },
});
