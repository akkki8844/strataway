export type ConfidenceBand = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type SustainabilityLevel = 'fragile' | 'stable' | 'stretch';

export interface ProbabilityPoint {
  stepIndex: number;
  band: ConfidenceBand;
}

export interface ProbabilityTimeline {
  routeId: string;
  points: ProbabilityPoint[];
}

export interface RiskFactor {
  id: string;
  label: string;
  description: string;
  domain: 'time' | 'difficulty' | 'consistency' | 'prerequisites' | 'external';
  level: RiskLevel;
  weight: number;
}

export interface RiskBreakdown {
  routeId: string;
  overall: RiskLevel;
  factors: RiskFactor[];
}

export interface RouteAnalyticsSummary {
  routeId: string;
  pace: string;
  estimatedWeeks: number;
  totalEffortHours: number;
  totalCost: number;
  risk: RiskLevel;
  sustainability: SustainabilityLevel;
  currentConfidence: ConfidenceBand;
}

export interface WeeklyLoad {
  routeId: string;
  weekIndex: number;
  plannedHours: number;
  maxHours: number;
  overload: boolean;
  burnoutRisk: 'low' | 'medium' | 'high' | 'very_high';
}

export interface AnalyticsSnapshot {
  routes: RouteAnalyticsSummary[];
  riskBreakdowns: RiskBreakdown[];
  probabilityTimelines: {
    routeId: string;
    points: ProbabilityPoint[];
  }[];
  weeklyLoads: WeeklyLoad[];
}
