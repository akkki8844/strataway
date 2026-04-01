import { create } from 'zustand';
import { SEED_USER } from '../../utils/seedData';
import { ThemeMode, DifficultyTolerance, ProgressPreference } from '../../types/user';

interface SettingsState {
  name: string;
  email: string;
  maxHoursPerWeek: number;
  maxBudget: number | null;
  difficultyTolerance: DifficultyTolerance;
  preferredProgress: ProgressPreference;
  theme: ThemeMode;
  showAdvancedAnalytics: boolean;
  explanationDetail: 'concise' | 'standard' | 'thorough';
  hasCompletedOnboarding: boolean;

  setMaxHours: (h: number) => void;
  setMaxBudget: (b: number | null) => void;
  setDifficultyTolerance: (d: DifficultyTolerance) => void;
  setPreferredProgress: (p: ProgressPreference) => void;
  setTheme: (t: ThemeMode) => void;
  setShowAdvancedAnalytics: (v: boolean) => void;
  setExplanationDetail: (d: 'concise' | 'standard' | 'thorough') => void;
  completeOnboarding: () => void;
  resetSettings: () => void;
}

const defaults = SEED_USER;

export const useSettingsStore = create<SettingsState>()((set) => ({
  name: defaults.profile.name,
  email: defaults.profile.email,
  maxHoursPerWeek: defaults.constraints.maxHoursPerWeek,
  maxBudget: defaults.constraints.maxBudget,
  difficultyTolerance: defaults.constraints.difficultyTolerance,
  preferredProgress: defaults.constraints.preferredProgress,
  theme: defaults.display.theme,
  showAdvancedAnalytics: defaults.display.showAdvancedAnalytics,
  explanationDetail: defaults.display.explanationDetail,
  hasCompletedOnboarding: true,

  setMaxHours: (h) => set({ maxHoursPerWeek: h }),
  setMaxBudget: (b) => set({ maxBudget: b }),
  setDifficultyTolerance: (d) => set({ difficultyTolerance: d }),
  setPreferredProgress: (p) => set({ preferredProgress: p }),
  setTheme: (t) => set({ theme: t }),
  setShowAdvancedAnalytics: (v) => set({ showAdvancedAnalytics: v }),
  setExplanationDetail: (d) => set({ explanationDetail: d }),
  completeOnboarding: () => set({ hasCompletedOnboarding: true }),
  resetSettings: () =>
    set({
      maxHoursPerWeek: 10,
      maxBudget: null,
      difficultyTolerance: 'medium',
      preferredProgress: 'balanced',
      theme: 'dark',
      showAdvancedAnalytics: false,
      explanationDetail: 'standard',
      hasCompletedOnboarding: false,
    }),
}));
