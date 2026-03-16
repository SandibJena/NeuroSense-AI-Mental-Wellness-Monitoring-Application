/**
 * Onboarding Screen – Welcome flow for new users.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import theme from '../theme/theme';

const { width, height } = Dimensions.get('window');

const STEPS = [
  {
    title: 'Welcome to NeuroSense',
    subtitle: 'AI-powered mental wellness monitoring\nusing your wearable device',
    icon: 'brain',
  },
  {
    title: 'Connect Your Device',
    subtitle: 'Link your wearable to start\ntracking your wellness',
    icon: 'watch',
  },
  {
    title: 'Create Your Account',
    subtitle: 'Set up your profile to\npersonalize your experience',
    icon: 'person',
  },
];

function LogoGraphic() {
  return (
    <Svg width={160} height={160} viewBox="0 0 160 160">
      <Defs>
        <LinearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={theme.colors.primary} />
          <Stop offset="1" stopColor={theme.colors.secondary} />
        </LinearGradient>
      </Defs>
      <Circle cx={80} cy={80} r={70} fill="url(#logoGrad)" opacity={0.15} />
      <Circle cx={80} cy={80} r={50} fill="url(#logoGrad)" opacity={0.25} />
      <Circle cx={80} cy={80} r={30} fill="url(#logoGrad)" opacity={0.4} />
      {/* Pulse line */}
      <Path
        d="M20 80 L50 80 L58 55 L68 105 L78 65 L88 95 L98 75 L108 80 L140 80"
        stroke={theme.colors.primary}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const DEVICES = [
  { type: 'smartwatch', name: 'Smartwatch', emoji: '⌚' },
  { type: 'ring', name: 'Smart Ring', emoji: '💍' },
  { type: 'band', name: 'Fitness Band', emoji: '📶' },
  { type: 'chest_strap', name: 'Chest Strap', emoji: '❤️' },
  { type: 'patch', name: 'Sensor Patch', emoji: '🩹' },
  { type: 'other', name: 'Other Device', emoji: '🔗' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Progress Dots */}
      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === step && styles.dotActive,
              i < step && styles.dotDone,
            ]}
          />
        ))}
      </View>

      {/* Step Content */}
      {step === 0 && (
        <View style={styles.stepContent}>
          <LogoGraphic />
          <Text style={styles.title}>{STEPS[0].title}</Text>
          <Text style={styles.subtitle}>{STEPS[0].subtitle}</Text>

          <View style={styles.featureList}>
            {[
              ['pulse', 'Real-time stress detection'],
              ['flame', 'Burnout risk prediction'],
              ['fitness', 'Recovery score analysis'],
              ['happy', 'Mood analytics & journaling'],
            ].map(([icon, text], i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={icon as any} size={20} color={theme.colors.primary} />
                </View>
                <Text style={styles.featureText}>{text}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {step === 1 && (
        <View style={styles.stepContent}>
          <Ionicons name="watch" size={80} color={theme.colors.primary} />
          <Text style={styles.title}>{STEPS[1].title}</Text>
          <Text style={styles.subtitle}>{STEPS[1].subtitle}</Text>

          <View style={styles.deviceGrid}>
            {DEVICES.map((device) => (
              <TouchableOpacity
                key={device.type}
                style={[
                  styles.deviceBtn,
                  selectedDevice === device.type && styles.deviceBtnActive,
                ]}
                onPress={() => setSelectedDevice(device.type)}
              >
                <Text style={styles.deviceEmoji}>{device.emoji}</Text>
                <Text style={styles.deviceName}>{device.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepContent}>
          <Ionicons name="person-circle" size={80} color={theme.colors.primary} />
          <Text style={styles.title}>{STEPS[2].title}</Text>
          <Text style={styles.subtitle}>{STEPS[2].subtitle}</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={theme.colors.onSurfaceVariant} />
              <TextInput
                style={styles.input}
                placeholder="Display Name"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.onSurfaceVariant} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.onSurfaceVariant} />
              <TextInput
                style={styles.input}
                placeholder="Password (min 8 chars)"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>
        </View>
      )}

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {step < 2 && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {step === 2 ? 'Get Started' : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={theme.colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: theme.spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceVariant,
  },
  dotActive: {
    width: 24,
    backgroundColor: theme.colors.primary,
  },
  dotDone: {
    backgroundColor: theme.colors.primary,
    opacity: 0.5,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  title: {
    ...theme.typography.displayMedium,
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  subtitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 24,
  },
  featureList: {
    marginTop: theme.spacing.xl,
    width: '100%',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  featureText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurface,
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
  deviceBtn: {
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    width: (width - 80) / 3,
  },
  deviceBtnActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
  },
  deviceEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  deviceName: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    color: theme.colors.onSurface,
    ...theme.typography.bodyLarge,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 40,
  },
  skipText: {
    ...theme.typography.labelLarge,
    color: theme.colors.onSurfaceVariant,
  },
  nextBtn: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  nextBtnText: {
    ...theme.typography.labelLarge,
    color: theme.colors.onPrimary,
  },
});
