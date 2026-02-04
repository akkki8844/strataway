export type DifficultyTolerance = 'low' | 'medium' | 'high';

export type ProgressPreference = 'fast' | 'balanced' | 'safe' | 'prestige';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface UserCoreProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface UserConstraints {
  maxHoursPerWeek: number;
  maxBudget: number | null;
  difficultyTolerance: DifficultyTolerance;
  preferredProgress: ProgressPreference;
}

export interface UserDisplayPreferences {
  theme: ThemeMode;
  showAdvancedAnalytics: boolean;
  explanationDetail: 'concise' | 'standard' | 'thorough';
}

export interface UserGoalPreference {
  goalId: string;
  activeRouteId: string | null;
  pinnedRouteIds: string[];
  excludedRouteIds: string[];
}

export interface UserState {
  profile: UserCoreProfile;
  constraints: UserConstraints;
  display: UserDisplayPreferences;
  goals: UserGoalPreference[];
  activeGoalId: string | null;
}
