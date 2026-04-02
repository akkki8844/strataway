export type ProgressPreference = 'fast' | 'balanced' | 'safe' | 'prestige';
export type DifficultyTolerance = 'low' | 'medium' | 'high';

export interface RouteCost {
  totalHours: number;
  totalCost: number;
}

export interface RouteMilestone {
  id: string;
  title: string;
  targetWeekIndex: number;
  isCritical: boolean;
}

export interface RoutePlan {
  meta: {
    id: string;
    label: string;
    profile: string;
  };
  weeks: number;
  cost: RouteCost;
  milestones: RouteMilestone[];
  tasks: Array<{
    id: string;
    title: string;
    skillId: string | null;
    weekIndex: number;
    estimatedHours: number;
  }>;
}
