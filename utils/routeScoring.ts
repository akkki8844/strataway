import { RoutePlan, RouteProfile } from '../types/route';
import {
  RiskLevel,
  SustainabilityLevel,
  EffortLevel,
  ProgressPace,
  RouteAnalyticsSummary,
} from '../types/analytics';

export interface RouteScoringConfig {
  timeWeight: number;
  costWeight: number;
  riskWeight: number;
  sustainabilityWeight: number;
}

const defaultConfig: RouteScoringConfig = {
  timeWeight: 0.3,
  costWeight: 0.2,
  riskWeight: 0.3,
  sustainabilityWeight: 0.2,
};

const riskScoreOrder: RiskLevel[] = [
  'very_low',
  'low',
  'medium',
  'high',
  'very_high',
];

const sustainabilityScoreOrder: SustainabilityLevel[] = [
  'fragile',
  'stable',
  'stretch',
];

const profileToPace: Record<RouteProfile, ProgressPace> = {
  fast: 'fast',
  balanced: 'balanced',
  safe: 'safe',
  prestige: 'prestige',
};

function normalize(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return values.map(() => 0.5);
  }
  return values.map((v) => (v - min) / (max - min));
}

function mapRiskToScore(level: RiskLevel): number {
  return riskScoreOrder.indexOf(level) / (riskScoreOrder.length - 1);
}

function mapSustainabilityToScore(level: SustainabilityLevel): number {
  return sustainabilityScoreOrder.indexOf(level) / (sustainabilityScoreOrder.length - 1);
}

function estimateEffortLevel(totalHours: number, weeks: number): EffortLevel {
  if (weeks <= 0) return 'moderate';
  const hoursPerWeek = totalHours / weeks;
  if (hoursPerWeek <= 5) return 'light';
  if (hoursPerWeek <= 12) return 'moderate';
  return 'heavy';
}

export function scoreRoutes(
  routes: RoutePlan[],
  config: Partial<RouteScoringConfig> = {}
): RouteAnalyticsSummary[] {
  if (routes.length === 0) return [];

  const mergedConfig: RouteScoringConfig = { ...defaultConfig, ...config };

  const durations = routes.map((r) => r.weeks);
  const efforts = routes.map((r) => r.cost.totalHours);
  const costs = routes.map((r) => r.cost.totalCost);

  const durationScores = normalize(durations).map((v) => 1 - v);
  const effortScores = normalize(efforts).map((v) => 1 - v);
  const costScores = normalize(costs).map((v) => 1 - v);

  const summaries: RouteAnalyticsSummary[] = routes.map((route, index) => {
    const riskScore = mapRiskToScore(route.risk.level);
    const sustainabilityScore = mapSustainabilityToScore(route.risk.sustainability);

    const timeComponent = (durationScores[index] + effortScores[index]) / 2;
    const costComponent = costScores[index];
    const riskComponent = 1 - riskScore;
    const sustainabilityComponent = 1 - sustainabilityScore;

    const compositeScore =
      timeComponent * mergedConfig.timeWeight +
      costComponent * mergedConfig.costWeight +
      riskComponent * mergedConfig.riskWeight +
      sustainabilityComponent * mergedConfig.sustainabilityWeight;

    const confidenceBand =
      compositeScore >= 0.8
        ? 'very_high'
        : compositeScore >= 0.6
        ? 'high'
        : compositeScore >= 0.4
        ? 'medium'
        : compositeScore >= 0.2
        ? 'low'
        : 'very_low';

    const effortLevel = estimateEffortLevel(route.cost.totalHours, route.weeks);

    const riskLevel: RiskLevel =
      compositeScore >= 0.8
        ? 'very_low'
        : compositeScore >= 0.6
        ? 'low'
        : compositeScore >= 0.4
        ? 'medium'
        : compositeScore >= 0.2
        ? 'high'
        : 'very_high';

    const sustainabilityLevel: SustainabilityLevel =
      effortLevel === 'light'
        ? 'stable'
        : effortLevel === 'moderate'
        ? 'stretch'
        : 'fragile';

    return {
      routeId: route.meta.id,
      goalId: route.goal.id,
      pace: profileToPace[route.meta.profile],
      estimatedWeeks: route.weeks,
      totalEffortHours: route.cost.totalHours,
      totalCost: route.cost.totalCost,
      risk: riskLevel,
      sustainability: sustainabilityLevel,
      currentConfidence: confidenceBand,
    };
  });

  return summaries;
}
