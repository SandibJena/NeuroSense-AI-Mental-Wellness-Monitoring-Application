/**
 * Device Management Screen – Connect and manage wearable devices.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme/theme';
import { deviceAPI } from '../../services/api';

const DEVICE_TEMPLATES = [
  { type: 'smartwatch', name: 'Apple Watch', icon: '⌚', provider: 'Apple HealthKit', color: '#A3AAAE', manufacturer: 'Apple' },
  { type: 'smartwatch', name: 'Samsung Galaxy Watch', icon: '⌚', provider: 'Samsung Health', color: '#1428A0', manufacturer: 'Samsung' },
  { type: 'smartwatch', name: 'Google Pixel Watch', icon: '⌚', provider: 'Health Connect', color: '#34A853', manufacturer: 'Google' },
  { type: 'smartwatch', name: 'Fitbit', icon: '📱', provider: 'Fitbit API', color: '#00B0B9', manufacturer: 'Google' },
  { type: 'ring', name: 'Oura Ring', icon: '💍', provider: 'Oura API', color: '#D4AF37', manufacturer: 'Oura' },
  { type: 'band', name: 'Whoop', icon: '📶', provider: 'Whoop API', color: '#111111', manufacturer: 'Whoop' },
  { type: 'chest_strap', name: 'Polar H10', icon: '❤️', provider: 'Bluetooth', color: '#E60012', manufacturer: 'Polar' },
  { type: 'smartwatch', name: 'Garmin', icon: '🏃', provider: 'Garmin Connect', color: '#007DC5', manufacturer: 'Garmin' },
];

interface ConnectedDevice {
  id: string;
  type: string;
  name: string;
  manufacturer?: string;
  provider?: string;
  isConnected: boolean;
  lastSynced: string | null;
}

interface CapabilityProfile {
  readiness_score: number;
  recommendation: string;
  combined_available_signals: string[];
}

const TEMPLATE_COLORS = ['#A3AAAE', '#1428A0', '#34A853', '#00B0B9', '#D4AF37', '#111111', '#E60012', '#007DC5', '#8B5CF6', '#F97316'];

const ICON_BY_TYPE: Record<string, string> = {
  smartwatch: '⌚',
  ring: '💍',
  band: '📶',
  chest_strap: '❤️',
  patch: '🩹',
  other: '🔗',
};

const prettifyType = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());

const formatLastSynced = (iso: string | null) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getApiError = (error: any, fallback: string) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim().length > 0) {
    return detail;
  }
  return fallback;
};

export default function DevicesScreen() {
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [deviceTemplates, setDeviceTemplates] = useState(DEVICE_TEMPLATES);
  const [capabilities, setCapabilities] = useState<CapabilityProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customType, setCustomType] = useState('');
  const [customName, setCustomName] = useState('');
  const [customManufacturer, setCustomManufacturer] = useState('');

  const loadDevices = async () => {
    try {
      const [supported, devices, capabilityProfile] = await Promise.all([
        deviceAPI.getSupported(),
        deviceAPI.list(),
        deviceAPI.getCapabilities(),
      ]);

      if (supported?.catalog && Array.isArray(supported.catalog)) {
        setDeviceTemplates(
          supported.catalog.map((device: any, index: number) => ({
            type: device.type,
            name: device.name,
            icon: device.icon || ICON_BY_TYPE[device.type] || '📱',
            provider: device.provider || 'Custom Integration',
            color: TEMPLATE_COLORS[index % TEMPLATE_COLORS.length],
            manufacturer: device.name?.split(' ')?.[0] || undefined,
          }))
        );
      }

      if (Array.isArray(devices)) {
        setConnectedDevices(
          devices
            .filter((d: any) => d.is_connected)
            .map((d: any) => ({
              id: d.id,
              type: d.device_type,
              name: d.device_name || prettifyType(d.device_type),
              isConnected: d.is_connected,
              lastSynced: formatLastSynced(d.last_synced_at),
              provider: deviceTemplates.find((t) => t.name.toLowerCase() === (d.device_name || '').toLowerCase())?.provider,
            }))
        );
      }

      if (capabilityProfile?.recommendation) {
        setCapabilities(capabilityProfile);
      }
    } catch (error: any) {
      const message = getApiError(error, 'Unable to load devices. Make sure you are logged in and backend is running.');
      Alert.alert('Device Sync Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleConnect = (device: typeof DEVICE_TEMPLATES[0]) => {
    const alreadyConnected = connectedDevices.some(
      (d) => d.type === device.type && d.name.toLowerCase() === device.name.toLowerCase() && d.isConnected
    );
    if (alreadyConnected) {
      Alert.alert('Already Connected', `${device.name} is already connected.`);
      return;
    }

    Alert.alert(
      `Connect ${device.name}`,
      `This will redirect you to ${device.provider} to authorize data access.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Connect',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await deviceAPI.connect(
                device.type,
                device.name,
                device.manufacturer,
                device.provider,
                'oauth'
              );
              await loadDevices();
            } catch (error: any) {
              Alert.alert('Connect Failed', getApiError(error, 'Unable to connect this device.'));
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleConnectCustom = async () => {
    const trimmedType = customType.trim().toLowerCase();
    const trimmedName = customName.trim();
    const trimmedManufacturer = customManufacturer.trim();

    if (!trimmedType || !trimmedName) {
      Alert.alert('Missing details', 'Please provide at least device type and device name.');
      return;
    }

    const duplicate = connectedDevices.some(
      (d) => d.type === trimmedType && d.name.toLowerCase() === trimmedName.toLowerCase() && d.isConnected
    );
    if (duplicate) {
      Alert.alert('Already Connected', 'This device is already connected.');
      return;
    }

    try {
      setIsSubmitting(true);
      await deviceAPI.connect(
        trimmedType,
        trimmedName,
        trimmedManufacturer || undefined,
        'Custom Integration',
        'manual',
        { source: 'manual-entry' }
      );

      setCustomType('');
      setCustomName('');
      setCustomManufacturer('');
      await loadDevices();
    } catch (error: any) {
      Alert.alert('Connect Failed', getApiError(error, 'Unable to connect this custom device.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSync = async (deviceId: string) => {
    try {
      setIsSubmitting(true);
      await deviceAPI.sync(deviceId);
      await loadDevices();
    } catch (error: any) {
      Alert.alert('Sync Failed', getApiError(error, 'Unable to sync this device right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = (deviceId: string) => {
    Alert.alert('Disconnect Device', 'Are you sure you want to disconnect this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsSubmitting(true);
            await deviceAPI.disconnect(deviceId);
            await loadDevices();
          } catch (error: any) {
            Alert.alert('Disconnect Failed', getApiError(error, 'Unable to disconnect this device.'));
          } finally {
            setIsSubmitting(false);
          }
        },
      },
    ]);
  };

  const isConnectedTemplate = (type: string, name: string) =>
    connectedDevices.some(
      (d) => d.type === type && d.name.toLowerCase() === name.toLowerCase() && d.isConnected
    );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading your devices...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Connected Devices */}
      <Text style={styles.sectionTitle}>Connected Devices</Text>
      {isSubmitting && (
        <View style={styles.inlineStatus}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.inlineStatusText}>Updating device connection...</Text>
        </View>
      )}

      {capabilities && (
        <View style={styles.capabilityCard}>
          <Text style={styles.capabilityTitle}>
            Analytics Readiness: {Math.round(capabilities.readiness_score)}%
          </Text>
          <Text style={styles.capabilityText}>{capabilities.recommendation}</Text>
          {!!capabilities.combined_available_signals?.length && (
            <Text style={styles.capabilitySignals}>
              Signals: {capabilities.combined_available_signals.join(', ')}
            </Text>
          )}
        </View>
      )}

      {connectedDevices.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="watch-outline" size={48} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.emptyText}>No devices connected</Text>
          <Text style={styles.emptySubtext}>Connect a wearable below to start monitoring</Text>
        </View>
      ) : (
        connectedDevices.map((device) => {
          const info = DEVICE_TEMPLATES.find(
            (d) => d.type === device.type && d.name.toLowerCase() === device.name.toLowerCase()
          );
          return (
            <View key={device.id} style={styles.deviceCard}>
              <View style={styles.deviceHeader}>
                <View style={[styles.deviceIcon, { backgroundColor: `${info?.color || '#999'}25` }]}>
                  <Text style={styles.deviceEmoji}>{info?.icon || '📱'}</Text>
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  {!!device.manufacturer && (
                    <Text style={styles.providerText}>{device.manufacturer}</Text>
                  )}
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
                    <Text style={styles.statusText}>Connected</Text>
                  </View>
                  {!!device.provider && (
                    <Text style={styles.providerText}>Provider: {device.provider}</Text>
                  )}
                  {device.lastSynced && (
                    <Text style={styles.syncText}>Last synced: {device.lastSynced}</Text>
                  )}
                </View>
              </View>
              <View style={styles.deviceActions}>
                <TouchableOpacity
                  style={styles.syncBtn}
                  onPress={() => handleSync(device.id)}
                >
                  <Ionicons name="sync" size={18} color={theme.colors.primary} />
                  <Text style={styles.syncBtnText}>Sync</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.disconnectBtn}
                  onPress={() => handleDisconnect(device.id)}
                >
                  <Ionicons name="close-circle-outline" size={18} color={theme.colors.error} />
                  <Text style={styles.disconnectBtnText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* Available Devices */}
      <Text style={[styles.sectionTitle, { marginTop: theme.spacing.lg }]}>
        Available Devices
      </Text>
      {deviceTemplates.filter((d) => !isConnectedTemplate(d.type, d.name)).map((device) => (
        <TouchableOpacity
          key={`${device.type}-${device.name}`}
          style={styles.availableCard}
          onPress={() => handleConnect(device)}
        >
          <View style={[styles.deviceIcon, { backgroundColor: `${device.color}25` }]}>
            <Text style={styles.deviceEmoji}>{device.icon}</Text>
          </View>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{device.name}</Text>
            <Text style={styles.providerText}>{device.provider}</Text>
          </View>
          <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      ))}

      <View style={styles.customCard}>
        <Text style={styles.customTitle}>Add Any Device</Text>
        <Text style={styles.customSubtitle}>
          Connect any stress monitoring device by entering its details.
        </Text>
        <TextInput
          value={customType}
          onChangeText={setCustomType}
          placeholder="Device type (e.g. smartwatch, ring, chest_strap)"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={styles.input}
        />
        <TextInput
          value={customName}
          onChangeText={setCustomName}
          placeholder="Device name/model"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={styles.input}
        />
        <TextInput
          value={customManufacturer}
          onChangeText={setCustomManufacturer}
          placeholder="Manufacturer (optional)"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={styles.input}
        />
        <TouchableOpacity style={styles.addCustomBtn} onPress={handleConnectCustom}>
          <Ionicons name="add-circle" size={18} color={theme.colors.onPrimary} />
          <Text style={styles.addCustomBtnText}>Connect Device</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    gap: theme.spacing.sm,
  },
  loadingText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.headlineMedium,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  inlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  inlineStatusText: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
  },
  capabilityCard: {
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
    marginBottom: theme.spacing.md,
  },
  capabilityTitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.primary,
  },
  capabilityText: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurface,
    marginTop: 4,
  },
  capabilitySignals: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginTop: 6,
  },
  emptyCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderStyle: 'dashed',
  },
  emptyText: {
    ...theme.typography.titleMedium,
    color: theme.colors.onSurface,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
  },
  deviceCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  deviceEmoji: {
    fontSize: 24,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    ...theme.typography.titleMedium,
    color: theme.colors.onSurface,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    ...theme.typography.bodySmall,
    color: theme.colors.success,
  },
  syncText: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  deviceActions: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: 6,
  },
  syncBtnText: {
    ...theme.typography.labelLarge,
    color: theme.colors.primary,
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.error}15`,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: 6,
  },
  disconnectBtnText: {
    ...theme.typography.labelLarge,
    color: theme.colors.error,
  },
  availableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  providerText: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  customCard: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  customTitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.onSurface,
  },
  customSubtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.onSurface,
    ...theme.typography.bodyMedium,
  },
  addCustomBtn: {
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addCustomBtnText: {
    ...theme.typography.labelLarge,
    color: theme.colors.onPrimary,
  },
});
