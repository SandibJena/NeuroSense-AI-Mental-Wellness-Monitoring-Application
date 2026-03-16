/**
 * Mood Screen – Mood journal with emoji selector and timeline.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme/theme';

const MOODS = [
  { key: 'HAPPY', emoji: '😊', label: 'Happy', color: theme.colors.moodHappy },
  { key: 'CALM', emoji: '😌', label: 'Calm', color: theme.colors.moodCalm },
  { key: 'NEUTRAL', emoji: '😐', label: 'Neutral', color: theme.colors.moodNeutral },
  { key: 'STRESSED', emoji: '😰', label: 'Stressed', color: theme.colors.moodStressed },
  { key: 'SAD', emoji: '😢', label: 'Sad', color: theme.colors.moodSad },
];

// Mock mood history
const MOCK_MOOD_HISTORY = [
  { id: '1', mood: 'HAPPY', notes: 'Feeling great today after a good workout!', createdAt: '2026-03-15T08:30:00' },
  { id: '2', mood: 'CALM', notes: 'Had a relaxing evening with family.', createdAt: '2026-03-14T20:15:00' },
  { id: '3', mood: 'STRESSED', notes: 'Work deadlines are stressful.', createdAt: '2026-03-14T12:00:00' },
  { id: '4', mood: 'NEUTRAL', notes: null, createdAt: '2026-03-13T09:00:00' },
  { id: '5', mood: 'HAPPY', notes: 'Good day overall, productive at work.', createdAt: '2026-03-12T17:30:00' },
  { id: '6', mood: 'SAD', notes: 'Feeling low energy, need more rest.', createdAt: '2026-03-11T14:00:00' },
  { id: '7', mood: 'CALM', notes: 'Meditation session helped a lot.', createdAt: '2026-03-10T08:00:00' },
];

export default function MoodScreen() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const getMoodInfo = (key: string) => MOODS.find((m) => m.key === key) || MOODS[2];

  const handleSubmit = () => {
    if (!selectedMood) {
      Alert.alert('Select a mood', 'Please select how you\'re feeling.');
      return;
    }
    Alert.alert('Mood Recorded!', `You're feeling ${getMoodInfo(selectedMood).label.toLowerCase()}. 🎉`);
    setSelectedMood(null);
    setNotes('');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Mood Input Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>How are you feeling?</Text>
        <Text style={styles.cardSubtitle}>Record your current mood</Text>

        <View style={styles.moodRow}>
          {MOODS.map((mood) => (
            <TouchableOpacity
              key={mood.key}
              style={[
                styles.moodButton,
                selectedMood === mood.key && { borderColor: mood.color, backgroundColor: `${mood.color}20` },
              ]}
              onPress={() => setSelectedMood(mood.key)}
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text
                style={[
                  styles.moodLabel,
                  selectedMood === mood.key && { color: mood.color },
                ]}
              >
                {mood.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.notesInput}
          placeholder="Add a note about how you're feeling... (optional)"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={500}
        />
        <Text style={styles.charCount}>{notes.length}/500</Text>

        <TouchableOpacity
          style={[styles.submitBtn, !selectedMood && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!selectedMood}
        >
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.onPrimary} />
          <Text style={styles.submitText}> Record Mood</Text>
        </TouchableOpacity>
      </View>

      {/* Mood Distribution */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mood Distribution</Text>
        <View style={styles.distRow}>
          {MOODS.map((mood) => {
            const count = MOCK_MOOD_HISTORY.filter((e) => e.mood === mood.key).length;
            const total = MOCK_MOOD_HISTORY.length;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <View key={mood.key} style={styles.distItem}>
                <Text style={styles.distEmoji}>{mood.emoji}</Text>
                <View style={styles.distBarContainer}>
                  <View
                    style={[styles.distBar, { height: `${Math.max(pct, 5)}%`, backgroundColor: mood.color }]}
                  />
                </View>
                <Text style={styles.distCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Mood Timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Entries</Text>
        {MOCK_MOOD_HISTORY.map((entry, index) => {
          const mood = getMoodInfo(entry.mood);
          return (
            <View key={entry.id} style={styles.timelineEntry}>
              <View style={styles.timelineLine}>
                <View style={[styles.timelineDot, { backgroundColor: mood.color }]} />
                {index < MOCK_MOOD_HISTORY.length - 1 && <View style={styles.timelineConnector} />}
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineEmoji}>{mood.emoji}</Text>
                  <Text style={[styles.timelineMood, { color: mood.color }]}>{mood.label}</Text>
                  <Text style={styles.timelineDate}>{formatDate(entry.createdAt)}</Text>
                  <Text style={styles.timelineTime}>{formatTime(entry.createdAt)}</Text>
                </View>
                {entry.notes && <Text style={styles.timelineNotes}>{entry.notes}</Text>}
              </View>
            </View>
          );
        })}
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
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  cardTitle: {
    ...theme.typography.titleLarge,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  cardSubtitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.md,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  moodButton: {
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 60,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodLabel: {
    ...theme.typography.labelSmall,
    color: theme.colors.onSurfaceVariant,
  },
  notesInput: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.onSurface,
    ...theme.typography.bodyMedium,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'right',
    marginTop: 4,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    ...theme.typography.labelLarge,
    color: theme.colors.onPrimary,
  },
  distRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    marginTop: theme.spacing.md,
  },
  distItem: {
    alignItems: 'center',
  },
  distEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  distBarContainer: {
    width: 28,
    height: 60,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  distBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  distCount: {
    ...theme.typography.labelSmall,
    color: theme.colors.onSurfaceVariant,
  },
  timelineEntry: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
  },
  timelineLine: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.outline,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: theme.spacing.md,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timelineEmoji: {
    fontSize: 16,
  },
  timelineMood: {
    ...theme.typography.labelLarge,
  },
  timelineDate: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 'auto',
  },
  timelineTime: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
  },
  timelineNotes: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurface,
    marginTop: 4,
    opacity: 0.8,
  },
});
