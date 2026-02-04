export type RouteProfile = 'fast' | 'balanced' | 'safe' | 'prestige';

export type RouteRiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export type RouteSustainability = 'fragile' | 'stable' | 'stretch';

export interface GoalConstraints {
  maxHoursPerWeek: number;
  maxBudget: number | null;
  difficultyTolerance: 'low' | 'medium' | 'high';
  preferredProfile: RouteProfile;
}

export interface RouteGoal {
  id: string;
  title: string;
  description: string;
  targetOutcome: string;
  constraints: GoalConstraints;
}

export interface RouteSkillRef {
  skillId: string;
  requiredLevel: number;
}

export interface RouteMilestone {
  id: string;
  title: string;
  description: string;
  targetWeekIndex: number;
  skills: RouteSkillRef[];
  isCritical: boolean;
}

export interface WeeklyTask {
  id: string;
  title: string;
  description: string;
  weekIndex: number;
  estimatedHours: number;
  skillId: string | null;
  milestoneId: string | null;
  isOptional: boolean;
}

export interface RouteCostSummary {
  totalHours: number;
  totalCost: number;
}

export interface RouteRiskSummary {
  level: RouteRiskLevel;
  sustainability: RouteSustainability;
}

export interface RouteMeta {
  id: string;
  label: string;
  profile: RouteProfile;
  createdAt: string;
}

export interface RoutePlan {
  meta: RouteMeta;
  goal: RouteGoal;
  milestones: RouteMilestone[];
  weeks: number;
  tasks: WeeklyTask[];
  cost: RouteCostSummary;
  risk: RouteRiskSummary;
}

export interface RouteComparisonSet {
  goal: RouteGoal;
  routes: RoutePlan[];
}
