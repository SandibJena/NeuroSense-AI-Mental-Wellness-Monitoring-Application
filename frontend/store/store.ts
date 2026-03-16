/**
 * Redux store configuration for NeuroSense.
 */
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

// ============ Auth Slice ============
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    wearableConnected: boolean;
    timezone: string;
  } | null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: false,
    token: null,
    user: null,
  } as AuthState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string; user: any }>) => {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
    },
    updateUser: (state, action: PayloadAction<Partial<AuthState['user']>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

// ============ Health Slice ============
interface StressData {
  stressScore: number;
  burnoutRisk: number;
  recoveryScore: number;
  confidence: number;
  contributingFactors: Record<string, number>;
  recommendations: string[];
  generatedAt: string;
}

interface HealthState {
  currentStress: StressData | null;
  stressTrend: Array<{
    date: string;
    stressScore: number;
    burnoutRisk: number;
    recoveryScore: number;
  }>;
  healthSummary: Array<{
    date: string;
    avgHeartRate: number | null;
    avgHrv: number | null;
    totalSleep: number | null;
    totalSteps: number | null;
  }>;
  moodEntries: Array<{
    id: string;
    mood: string;
    notes: string | null;
    createdAt: string;
  }>;
  isLoading: boolean;
  lastUpdated: string | null;
}

const healthSlice = createSlice({
  name: 'health',
  initialState: {
    currentStress: null,
    stressTrend: [],
    healthSummary: [],
    moodEntries: [],
    isLoading: false,
    lastUpdated: null,
  } as HealthState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCurrentStress: (state, action: PayloadAction<StressData>) => {
      state.currentStress = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    setStressTrend: (state, action) => {
      state.stressTrend = action.payload;
    },
    setHealthSummary: (state, action) => {
      state.healthSummary = action.payload;
    },
    setMoodEntries: (state, action) => {
      state.moodEntries = action.payload;
    },
    addMoodEntry: (state, action) => {
      state.moodEntries.unshift(action.payload);
    },
  },
});

// ============ Settings Slice ============
interface SettingsState {
  stressAlertThreshold: number;
  burnoutAlertEnabled: boolean;
  syncFrequency: string;
  notificationsEnabled: boolean;
  hapticFeedback: boolean;
  theme: 'dark' | 'light';
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    stressAlertThreshold: 70,
    burnoutAlertEnabled: true,
    syncFrequency: 'every_30_min',
    notificationsEnabled: true,
    hapticFeedback: true,
    theme: 'dark',
  } as SettingsState,
  reducers: {
    setStressThreshold: (state, action: PayloadAction<number>) => {
      state.stressAlertThreshold = action.payload;
    },
    toggleBurnoutAlert: (state) => {
      state.burnoutAlertEnabled = !state.burnoutAlertEnabled;
    },
    setSyncFrequency: (state, action: PayloadAction<string>) => {
      state.syncFrequency = action.payload;
    },
    toggleNotifications: (state) => {
      state.notificationsEnabled = !state.notificationsEnabled;
    },
    toggleHapticFeedback: (state) => {
      state.hapticFeedback = !state.hapticFeedback;
    },
  },
});

// ============ Store ============
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    health: healthSlice.reducer,
    settings: settingsSlice.reducer,
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export const {
  setLoading,
  setCurrentStress,
  setStressTrend,
  setHealthSummary,
  setMoodEntries,
  addMoodEntry,
} = healthSlice.actions;
export const {
  setStressThreshold,
  toggleBurnoutAlert,
  setSyncFrequency,
  toggleNotifications,
  toggleHapticFeedback,
} = settingsSlice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
