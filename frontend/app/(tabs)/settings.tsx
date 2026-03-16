/**
 * Settings Screen – App preferences, notifications, and data management.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme/theme';

type SyncFrequency = 'realtime' | 'every_30_min' | 'every_6_hours';

function SettingRow({
  icon,
  label,
  value,
  onPress,
  showArrow = true,
  danger = false,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingLeft}>
        <Ionicons
          name={icon as any}
          size={22}
          color={danger ? theme.colors.error : theme.colors.primary}
        />
        <Text style={[styles.settingLabel, danger && { color: theme.colors.error }]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {showArrow && (
          <Ionicons name="chevron-forward" size={18} color={theme.colors.onSurfaceVariant} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function SettingToggle({
  icon,
  label,
  description,
  value,
  onToggle,
}: {
  icon: string;
  label: string;
  description?: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingLeft, { flex: 1 }]}>
        <Ionicons name={icon as any} size={22} color={theme.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.settingLabel}>{label}</Text>
          {description && <Text style={styles.settingDesc}>{description}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.colors.surfaceVariant, true: `${theme.colors.primary}80` }}
        thumbColor={value ? theme.colors.primary : theme.colors.onSurfaceVariant}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [burnoutAlerts, setBurnoutAlerts] = useState(true);
  const [stressAlerts, setStressAlerts] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [syncFrequency, setSyncFrequency] = useState<SyncFrequency>('every_30_min');
  const [stressThreshold, setStressThreshold] = useState(70);

  const syncLabels: Record<SyncFrequency, string> = {
    realtime: 'Real-time',
    every_30_min: 'Every 30 min',
    every_6_hours: 'Every 6 hours',
  };

  const handleSyncFrequency = () => {
    const options: SyncFrequency[] = ['realtime', 'every_30_min', 'every_6_hours'];
    const buttons = options.map((opt) => ({
      text: syncLabels[opt],
      onPress: () => setSyncFrequency(opt),
    }));
    buttons.push({ text: 'Cancel', onPress: () => {} });
    Alert.alert('Sync Frequency', 'Choose how often to sync wearable data', buttons);
  };

  const handleExport = () => {
    Alert.alert(
      'Export Data',
      'Export your health data as JSON or CSV?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'JSON', onPress: () => Alert.alert('Export', 'Data exported as JSON ✅') },
        { text: 'CSV', onPress: () => Alert.alert('Export', 'Data exported as CSV ✅') },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => Alert.alert('Account Deleted', 'Your account has been deleted.'),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AD</Text>
        </View>
        <View>
          <Text style={styles.profileName}>Alex Demo</Text>
          <Text style={styles.profileEmail}>demo@neurosense.app</Text>
        </View>
        <TouchableOpacity style={styles.editBtn}>
          <Ionicons name="pencil" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.card}>
        <SettingToggle
          icon="notifications"
          label="Push Notifications"
          description="Receive alerts and insights"
          value={notificationsEnabled}
          onToggle={() => setNotificationsEnabled(!notificationsEnabled)}
        />
        <View style={styles.divider} />
        <SettingToggle
          icon="alert-circle"
          label="Stress Alerts"
          description={`Alert when stress exceeds ${stressThreshold}`}
          value={stressAlerts}
          onToggle={() => setStressAlerts(!stressAlerts)}
        />
        <View style={styles.divider} />
        <SettingToggle
          icon="flame"
          label="Burnout Warnings"
          description="Get notified of burnout risk"
          value={burnoutAlerts}
          onToggle={() => setBurnoutAlerts(!burnoutAlerts)}
        />
      </View>

      {/* Data & Sync */}
      <Text style={styles.sectionTitle}>Data & Sync</Text>
      <View style={styles.card}>
        <SettingRow
          icon="sync"
          label="Sync Frequency"
          value={syncLabels[syncFrequency]}
          onPress={handleSyncFrequency}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="download"
          label="Export Health Data"
          onPress={handleExport}
        />
      </View>

      {/* Preferences */}
      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.card}>
        <SettingToggle
          icon="body"
          label="Haptic Feedback"
          value={hapticFeedback}
          onToggle={() => setHapticFeedback(!hapticFeedback)}
        />
        <View style={styles.divider} />
        <SettingRow icon="language" label="Language" value="English" onPress={() => {}} />
        <View style={styles.divider} />
        <SettingRow icon="time" label="Timezone" value="Asia/Kolkata" onPress={() => {}} />
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.card}>
        <SettingRow icon="information-circle" label="Version" value="1.0.0" showArrow={false} />
        <View style={styles.divider} />
        <SettingRow icon="document-text" label="Privacy Policy" onPress={() => {}} />
        <View style={styles.divider} />
        <SettingRow icon="help-circle" label="Help & Support" onPress={() => {}} />
      </View>

      {/* Danger Zone */}
      <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>Danger Zone</Text>
      <View style={styles.card}>
        <SettingRow
          icon="log-out"
          label="Log Out"
          onPress={() => Alert.alert('Logged out')}
          danger
        />
        <View style={styles.divider} />
        <SettingRow
          icon="trash"
          label="Delete Account"
          onPress={handleDeleteAccount}
          danger
        />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    ...theme.typography.headlineMedium,
    color: theme.colors.onPrimary,
  },
  profileName: {
    ...theme.typography.titleLarge,
    color: theme.colors.onSurface,
  },
  profileEmail: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
  editBtn: {
    marginLeft: 'auto',
    padding: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  settingLabel: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurface,
  },
  settingDesc: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  settingValue: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
    marginLeft: theme.spacing.xxl + theme.spacing.md,
  },
});
