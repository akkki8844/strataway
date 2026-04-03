import { RoutePlan, RouteComparisonSet, RouteCost } from '../types/route';
import { Task } from '../types/task';
import { UserConstraints } from '../types/user';

/**
 * Route Scoring & Heuristics Engine
 * 
 * Takes raw analytical telemetry and user constraints to calculate holistic 
 * "Alignment Scores" for available topographical routes.
 * 
 * Philosophy: 
 * Route selection is rarely a purely mathematical exercise; it requires weighing
 * emotional constraints (difficulty tolerance) against hard constraints (budget, time).
 * 
 * This module generates deterministic scores between 0 - 100 based on the variance
 * between a RoutePlan's demands and the UserConstraints profile.
 */

export interface DetailedRouteScore {
  totalScore: number;
  breakdown: {
    timeAlignment: number;       // 0-100: How well estimated hours fit max capacity
    costAlignment: number;       // 0-100: How well total cost fits budget
    difficultyAlignment: number; // 0-100: Intensity match vs user tolerance
    velocityAlignment: number;   // 0-100: Expected completion time vs profile preference
  };
  penalties: Array<{
    type: 'critical' | 'warning';
    domain: string;
    description: string;
    impact: number;
  }>;
  isFeasible: boolean; // False if hard constraints are completely violated
}

// ─── Weight Matrices ─────────────────────────────────────────────────────────

const PREFERENCE_WEIGHTS = {
  fast: { time: 0.2, cost: 0.1, difficulty: 0.1, velocity: 0.6 },
  balanced: { time: 0.3, cost: 0.2, difficulty: 0.2, velocity: 0.3 },
  safe: { time: 0.4, cost: 0.2, difficulty: 0.3, velocity: 0.1 }
};

const DIFFICULTY_MAP = {
  low: 1,
  medium: 5,
  high: 9
};

// ─── Main Evaluation Algorithm ───────────────────────────────────────────────

/**
 * scoreRoutes
 * 
 * Applies the engine heuristics across a set of routes given the current user constraints.
 */
export function scoreRoutes(
  routes: RoutePlan[], 
  constraints: UserConstraints
): Array<RoutePlan & { evaluation: DetailedRouteScore }> {
  
  return routes.map(route => {
    const evaluation = evaluateSingleRoute(route, constraints);
    return {
      ...route,
      evaluation
    };
  }).sort((a, b) => b.evaluation.totalScore - a.evaluation.totalScore);
}

/**
 * Detailed evaluation of a single route topology against user constraints.
 */
function evaluateSingleRoute(route: RoutePlan, constraints: UserConstraints): DetailedRouteScore {
  const penalties: DetailedRouteScore['penalties'] = [];
  let isFeasible = true;

  // 1. Time Alignment (Capacity Strain)
  // How many hours per week does this route average? Max capacity is constraints.maxHoursPerWeek.
  const averageHoursPerWeek = route.cost.totalHours / route.weeks;
  const utilizedCapacityFraction = averageHoursPerWeek / constraints.maxHoursPerWeek;
  
  let timeAlignment = 100;
  if (utilizedCapacityFraction > 1.0) {
    // Exceeds max capacity on average
    const overrun = utilizedCapacityFraction - 1.0;
    timeAlignment = Math.max(0, 100 - (overrun * 200)); 
    penalties.push({
      type: 'critical',
      domain: 'time',
      description: `Baseline average (${averageHoursPerWeek.toFixed(1)}h/wk) exceeds maximum capacity (${constraints.maxHoursPerWeek}h/wk).`,
      impact: 40
    });
    isFeasible = (utilizedCapacityFraction < 1.3); // Hard cutoff if >30% over capacity
  } else if (utilizedCapacityFraction < 0.3) {
    // Highly underutilized
    timeAlignment = 75; 
    penalties.push({
      type: 'warning',
      domain: 'time',
      description: 'Route does not fully utilize available temporal capacity.',
      impact: 10
    });
  }

  // 2. Cost Alignment
  let costAlignment = 100;
  if (constraints.maxBudget !== null) {
    if (route.cost.totalCost > constraints.maxBudget) {
      costAlignment = 0;
      penalties.push({
        type: 'critical',
        domain: 'budget',
        description: `Financial requirement ($${route.cost.totalCost}) exceeds limit ($${constraints.maxBudget}).`,
        impact: 50
      });
      isFeasible = false;
    } else {
      // Cost is within budget, score based on how close to budget
      const budgetUtilization = route.cost.totalCost / (constraints.maxBudget || 1);
      costAlignment = 100 - (budgetUtilization * 20); // Minor penalty for spending more
    }
  }

  // 3. Difficulty Alignment
  // Map route's profile pace to difficulty heuristic
  let routeDifficultyIntensity = 5; // Default medium
  if (route.meta.profile === 'fast' || route.meta.profile === 'prestige') routeDifficultyIntensity = 8;
  if (route.meta.profile === 'safe') routeDifficultyIntensity = 3;

  const userToleranceIntensity = DIFFICULTY_MAP[constraints.difficultyTolerance] ?? 5;
  const difficultyDelta = Math.abs(routeDifficultyIntensity - userToleranceIntensity);
  
  // -15 points per unit of variance
  const difficultyAlignment = Math.max(0, 100 - (difficultyDelta * 15));
  
  if (difficultyDelta >= 4) {
    penalties.push({
      type: 'warning',
      domain: 'psychological',
      description: `Intensity of this path (${route.meta.profile}) clashes significantly with stated tolerance.`,
      impact: 25
    });
  }

  // 4. Velocity Alignment
  // Does the user want it fast or safe? Compare to route profile.
  let velocityAlignment = 100;
  if (constraints.preferredProgress !== route.meta.profile && constraints.preferredProgress !== 'balanced') {
    // Direct mismatch (e.g. wants safe, route is fast)
    velocityAlignment = 50;
    penalties.push({
      type: 'warning',
      domain: 'velocity',
      description: `Pacing profile (${route.meta.profile}) misaligned with preference (${constraints.preferredProgress}).`,
      impact: 15
    });
  } else if (constraints.preferredProgress === 'balanced' && route.meta.profile !== 'balanced') {
    // Minor mismatch
    velocityAlignment = 85;
  }

  // Calculate Weighted Total
  const weights = PREFERENCE_WEIGHTS[constraints.preferredProgress as keyof typeof PREFERENCE_WEIGHTS] 
                  ?? PREFERENCE_WEIGHTS.balanced;

  let baseScore = (
    (timeAlignment * weights.time) +
    (costAlignment * weights.cost) +
    (difficultyAlignment * weights.difficulty) +
    (velocityAlignment * weights.velocity)
  );

  // Apply absolute penalty impact
  const totalPenaltyImpact = penalties.reduce((sum, p) => sum + p.impact, 0);
  let finalScore = Math.max(0, baseScore - totalPenaltyImpact);

  if (!isFeasible) {
    finalScore = Math.min(finalScore, 40); // Cap score if objectively unfeasible
  }

  return {
    totalScore: Math.round(finalScore),
    breakdown: {
      timeAlignment: Math.round(timeAlignment),
      costAlignment: Math.round(costAlignment),
      difficultyAlignment: Math.round(difficultyAlignment),
      velocityAlignment: Math.round(velocityAlignment),
    },
    penalties,
    isFeasible
  };
}

// ─── Comparative Analytics ───────────────────────────────────────────────────

/**
 * Generates textual insights comparing multiple scored routes to help the user choose.
 */
export function generateRouteInsights(scoredRoutes: Array<RoutePlan & { evaluation: DetailedRouteScore }>): string[] {
  const insights: string[] = [];
  if (scoredRoutes.length === 0) return insights;

  const topRoute = scoredRoutes[0];
  insights.push(`The ${topRoute.meta.label} aligns heavily (${topRoute.evaluation.totalScore}%) with your topographical constraints.`);

  const unfeasible = scoredRoutes.filter(r => !r.evaluation.isFeasible);
  if (unfeasible.length > 0) {
    insights.push(`Warning: ${unfeasible.length} path(s) break your hard limit constraints and are marked strictly unfeasible.`);
  }

  const safest = scoredRoutes.reduce((prev, curr) => (curr.evaluation.breakdown.difficultyAlignment > prev.evaluation.breakdown.difficultyAlignment) ? curr : prev);
  if (safest.meta.id !== topRoute.meta.id) {
    insights.push(`If psychological/difficulty strain is your primary concern, consider the ${safest.meta.label} instead.`);
  }

  return insights;
}
