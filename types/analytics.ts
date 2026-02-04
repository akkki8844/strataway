export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export type EffortLevel = 'light' | 'moderate' | 'heavy';

export type SustainabilityLevel = 'fragile' | 'stable' | 'stretch';

export type ProgressPace = 'fast' | 'balanced' | 'safe' | 'prestige';

/**
 * Relative confidence band, not an absolute probability.
 */
export type ConfidenceBand =
  | 'very_low'
  | 'low'
  | 'medium'
  | 'high'
  | 'very_high';

export interface ConfidencePoint {
  /**
   * Zero-based index into the timeline (e.g. week).
   */
  stepIndex: number;
  band: ConfidenceBand;
}

export interface ProbabilityTimeline {
  routeId: string;
  points: ConfidencePoint[];
}

export interface RiskFactor {
  id: string;
  label: string;
  description?: string;
  level: RiskLevel;
  /**
   * Relative contribution to overall risk (0–1, used comparatively).
   */
  weight: number;
  domain:
    | 'time'
    | 'difficulty'
    | 'consistency'
    | 'prerequisites'
    | 'external';
}

export interface RiskBreakdown {
  routeId: string;
  overall: RiskLevel;
  factors: RiskFactor[];
}

export interface WeeklyLoadSnapshot {
  routeId: string;
  /**
   * Zero-based week index on the route timeline.
   */
  weekIndex: number;
  plannedHours: number;
  maxHours: number;
  effortLevel: EffortLevel;
  burnoutRisk: RiskLevel;
  overload: boolean;
}

export interface RouteAnalyticsSummary {
  routeId: string;
  goalId: string;
  pace: ProgressPace;
  /**
   * Estimated total duration in weeks (used for comparison, not exact).
   */
  estimatedWeeks: number;
  /**
   * Aggregate effort in hours (relative).
   */
  totalEffortHours: number;
  /**
   * Aggregate cost in arbitrary units; currency is handled at the UI layer.
   */
  totalCost: number;
  risk: RiskLevel;
  sustainability: SustainabilityLevel;
  /**
   * Current confidence band for reaching the goal along this route.
   */
  currentConfidence: ConfidenceBand;
}

export interface AnalyticsSnapshot {
  routes: RouteAnalyticsSummary[];
  probabilityTimelines: ProbabilityTimeline[];
  riskBreakdowns: RiskBreakdown[];
  weeklyLoads: WeeklyLoadSnapshot[];
}
