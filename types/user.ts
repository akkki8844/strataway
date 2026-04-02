import { DifficultyTolerance, ProgressPreference } from './route';

export type { DifficultyTolerance, ProgressPreference };

export interface UserConstraints {
  maxHoursPerWeek: number;
  maxBudget: number | null;
  difficultyTolerance: DifficultyTolerance;
  preferredProgress: ProgressPreference;
  theme: 'dark' | 'light' | 'system';
  showAdvancedAnalytics: boolean;
  explanationDetail: 'concise' | 'standard' | 'thorough';
}

export type ThemeMode = 'dark' | 'light' | 'system';

export interface UserState {
  profile: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  constraints: Pick<UserConstraints, 'maxHoursPerWeek' | 'maxBudget' | 'difficultyTolerance' | 'preferredProgress'>;
  display: {
    theme: ThemeMode;
    showAdvancedAnalytics: boolean;
    explanationDetail: 'concise' | 'standard' | 'thorough';
  };
  goals: Array<{
    goalId: string;
    activeRouteId: string | null;
    pinnedRouteIds: string[];
    excludedRouteIds: string[];
  }>;
  activeGoalId: string | null;
}
