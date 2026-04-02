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
