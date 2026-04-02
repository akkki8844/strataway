export type ConfidenceBand = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type SustainabilityLevel = 'fragile' | 'stable' | 'stretch';

export interface ProbabilityPoint {
  stepIndex: number;
  band: ConfidenceBand;
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

export interface AnalyticsSnapshot {
  routes: {
    routeId: string;
    pace: string;
    estimatedWeeks: number;
    totalEffortHours: number;
    totalCost: number;
    risk: RiskLevel;
    sustainability: SustainabilityLevel;
    currentConfidence: ConfidenceBand;
  }[];
  riskBreakdowns: RiskBreakdown[];
  probabilityTimelines: {
    routeId: string;
    points: ProbabilityPoint[];
  }[];
  weeklyLoads: {
    routeId: string;
    weekIndex: number;
    plannedHours: number;
    maxHours: number;
    overload: boolean;
    burnoutRisk: 'low' | 'medium' | 'high' | 'very_high';
  }[];
}
