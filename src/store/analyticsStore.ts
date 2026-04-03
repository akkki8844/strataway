import { create } from 'zustand';
import { AnalyticsSnapshot, RouteAnalyticsSummary, WeeklyLoad, RiskBreakdown, ProbabilityPoint, RiskFactor, ProbabilityTimeline } from '../../types/analytics';
import { SEED_ANALYTICS } from '../../utils/seedData';
import { Task } from '../../types/task';
import { calculateTheoreticalMinimumDuration } from '../../utils/timelineRules';

/**
 * Analytics Engine Store
 * 
 * This module manages the real-time, deterministic calculation of timeline risks,
 * capacity boundaries, and probabilistic success models. It replaces the mock 
 * analytics snapshot over time with dynamic calculations dependent on the active
 * task graph and current simulation metrics.
 */

interface AnalyticsState {
  // Base State Layer
  snapshot: AnalyticsSnapshot;
  activeRouteId: string;
  isLoading: boolean;
  isSimulating: boolean;

  // Real-time cached computation
  computationCache: Record<string, any>;
  lastCalculationTimestamp: number;

  // Actions
  setActiveAnalyticsRoute: (routeId: string) => void;
  triggerDeepSimulation: () => void;
  invalidateCache: () => void;

  // Complex Selectors (Engine Accessors)
  getRouteAnalytics: (routeId: string, tasks?: Task[], maxHours?: number) => RouteAnalyticsSummary | undefined;
  getWeeklyLoads: (routeId: string, tasks?: Task[], maxHours?: number) => WeeklyLoad[];
  getOverloadWeeks: (routeId: string, tasks?: Task[], maxHours?: number) => number[];
  
  // Advanced Telemetry Accessors
  getRiskBreakdown: (routeId: string, tasks?: Task[], maxHours?: number) => RiskBreakdown | undefined;
  getProbabilityTimeline: (routeId: string, tasks?: Task[], maxHours?: number) => { routeId: string; points: ProbabilityPoint[] } | undefined;
  getPeakBurnoutWeek: (routeId: string, tasks?: Task[], maxHours?: number) => number | null;
  getCapacityEfficiencyRating: (routeId: string, tasks?: Task[], maxHours?: number) => number;
}

export const useAnalyticsStore = create<AnalyticsState>()((set, get) => ({
  snapshot: SEED_ANALYTICS,
  activeRouteId: 'route_balanced',
  isLoading: false,
  isSimulating: false,
  computationCache: {},
  lastCalculationTimestamp: Date.now(),

  // ─── Direct Mutations ────────────────────────────────────────────────────────

  setActiveAnalyticsRoute: (routeId) => set({ activeRouteId: routeId }),

  invalidateCache: () => set({ 
    computationCache: {}, 
    lastCalculationTimestamp: Date.now() 
  }),

  triggerDeepSimulation: () => {
    // Simulates an intensive background calculation for realism in prototype
    set({ isSimulating: true });
    get().invalidateCache();
    setTimeout(() => {
      set({ isSimulating: false });
    }, 1200);
  },

  // ─── Primary Selectors ───────────────────────────────────────────────────────

  getRouteAnalytics: (routeId, tasks, maxHours) => {
    const base = get().snapshot.routes.find((r) => r.routeId === routeId);
    if (!base) return undefined;
    
    // If no context provided, return static snapshot seed
    if (!tasks || !maxHours) return base;

    // Cache key generation wrapper
    const cacheKey = `ra_${routeId}_${maxHours}_${tasks.filter(t=>t.execution.status==='completed').length}`;
    if (get().computationCache[cacheKey]) {
      return get().computationCache[cacheKey];
    }

    // Dynamic Calculation Sequence
    const overloads = get().getOverloadWeeks(routeId, tasks, maxHours);
    const activeTasksCount = tasks.filter(t => t.execution.status !== 'completed').length;
    
    // 1. Calculate Risk Base
    let risk: RouteAnalyticsSummary['risk'] = 'low';
    if (overloads.length > Math.max(2, activeTasksCount * 0.15)) risk = 'very_high';
    else if (overloads.length > Math.max(1, activeTasksCount * 0.08)) risk = 'high';
    else if (overloads.length > 0) risk = 'medium';

    // 2. Adjust for theoretical minimum
    const theoreticalMin = calculateTheoreticalMinimumDuration(tasks, maxHours);
    const scheduledMax = Math.max(...tasks.map(t => t.core.weekIndex)) + 1;
    
    // If the schedule is significantly tighter than theoretical, risk increases
    if (scheduledMax < theoreticalMin * 0.9) {
       risk = 'very_high';
    }

    // 3. Confidence Calculation
    // Confidence is an inverse function of unmitigated risk and forward variance
    let confidence: RouteAnalyticsSummary['currentConfidence'] = 'high';
    if (risk === 'very_high') confidence = 'very_low';
    else if (risk === 'high') confidence = 'low';
    else if (risk === 'medium') confidence = 'medium';
    else if (theoreticalMin < scheduledMax * 0.8) confidence = 'very_high'; // Tons of slack

    // Build the dynamic payload
    const dynamicAnalytics: RouteAnalyticsSummary = { 
      ...base, 
      risk, 
      currentConfidence: confidence,
      sustainability: overloads.length > 0 ? (overloads.length > 3 ? 'fragile' : 'stretch') : 'stable'
    };

    // Safely cache it to prevent continuous recalculation
    get().computationCache[cacheKey] = dynamicAnalytics;
    return dynamicAnalytics;
  },

  getWeeklyLoads: (routeId, tasks, maxHours) => {
    if (!tasks || !maxHours) {
      return get().snapshot.weeklyLoads.filter((l) => l.routeId === routeId);
    }

    const loadsMap = new Map<number, number>();
    
    // We only care about work that consumes future/current capacity
    tasks.forEach(t => {
      if (t.execution.status !== 'completed' && t.execution.status !== 'skipped') {
        const w = t.core.weekIndex;
        loadsMap.set(w, (loadsMap.get(w) ?? 0) + t.core.estimatedHours);
      }
    });

    const maxWeek = Math.max(...tasks.map(t => t.core.weekIndex), 0);
    const loads: WeeklyLoad[] = [];
    
    for (let i = 0; i <= maxWeek; i++) {
        const planned = loadsMap.get(i) ?? 0;
        let burnoutRisk: 'low' | 'medium' | 'high' | 'very_high' = 'low';
        
        if (planned > maxHours * 1.5) burnoutRisk = 'very_high';
        else if (planned > maxHours * 1.2) burnoutRisk = 'high';
        else if (planned > maxHours) burnoutRisk = 'medium';

        loads.push({
            routeId,
            weekIndex: i,
            plannedHours: planned,
            maxHours,
            overload: planned > maxHours,
            burnoutRisk
        });
    }
    return loads;
  },

  getOverloadWeeks: (routeId, tasks, maxHours) => {
    return get().getWeeklyLoads(routeId, tasks, maxHours)
      .filter(l => l.overload)
      .map(l => l.weekIndex);
  },

  // ─── Advanced Telemetry Computation ──────────────────────────────────────────

  getRiskBreakdown: (routeId, tasks, maxHours) => {
    // If no context, return static
    if (!tasks || !maxHours) {
      return get().snapshot.riskBreakdowns.find((r) => r.routeId === routeId);
    }

    // Dynamic Risk Factor generation based on raw task arrays
    const breakdown: RiskBreakdown = {
      routeId,
      overall: 'low',
      factors: []
    };

    const overloads = get().getOverloadWeeks(routeId, tasks, maxHours);
    const weekCount = Math.max(...tasks.map(t => t.core.weekIndex)) + 1;
    
    // Domain 1: Time Commitment Risk
    let timeLevel: 'low' | 'medium' | 'high' | 'very_high' = 'low';
    let timeWeight = 0.20;
    if (overloads.length > 0) {
      timeLevel = overloads.length > 2 ? 'high' : 'medium';
      timeWeight = overloads.length > 4 ? 0.4 : 0.3;
    }
    
    breakdown.factors.push({
      id: `rf_time_${routeId}`,
      label: 'Time Commitment Viability',
      description: overloads.length > 0 
        ? `Identified ${overloads.length} weeks exceeding the strict ${maxHours}h capacity.` 
        : `Timeline aligns strictly with ${maxHours}h constraint.`,
      level: timeLevel,
      weight: timeWeight,
      domain: 'time'
    });

    // Domain 2: Consistency Risk (Are there large gaps in the timeline?)
    const loads = get().getWeeklyLoads(routeId, tasks, maxHours);
    let gapCount = 0;
    for (let i = 1; i < loads.length - 1; i++) {
      if (loads[i].plannedHours === 0 && loads[i-1].plannedHours > 0 && loads[i+1].plannedHours > 0) {
        gapCount++;
      }
    }
    
    let consLevel: 'low' | 'medium' | 'high' | 'very_high' = 'low';
    if (gapCount >= 2) consLevel = 'medium';
    if (gapCount >= 4) consLevel = 'high';

    breakdown.factors.push({
      id: `rf_cons_${routeId}`,
      label: 'Pacing & Consistency',
      description: gapCount > 0 
        ? `Detected ${gapCount} operational gaps (zero-hour weeks) breaking momentum.`
        : 'High density operational flow without momentum breaks.',
      level: consLevel,
      weight: 0.25,
      domain: 'consistency'
    });

    // Domain 3: Difficulty Threshold Risk (Are there massive difficulty spikes?)
    const maxSpike = Math.max(...loads.map(l => l.plannedHours));
    const avgLoad = loads.reduce((sum, l) => sum + l.plannedHours, 0) / loads.length || 1;
    let diffLevel: 'low' | 'medium' | 'high' | 'very_high' = 'low';
    
    if (maxSpike > avgLoad * 2.5) diffLevel = 'very_high';
    else if (maxSpike > avgLoad * 1.8) diffLevel = 'high';
    else if (maxSpike > avgLoad * 1.4) diffLevel = 'medium';

    breakdown.factors.push({
      id: `rf_diff_${routeId}`,
      label: 'Difficulty Curve Smoothing',
      description: diffLevel === 'high' || diffLevel === 'very_high'
        ? 'Severe structural spikes detected. Load is highly localized.'
        : 'Standard load variance within operational tolerance.',
      level: diffLevel,
      weight: 0.35,
      domain: 'difficulty'
    });

    // Overall Calculation
    const totalRiskScore = breakdown.factors.reduce((sum, f) => {
      let val = 1;
      if (f.level === 'medium') val = 3;
      if (f.level === 'high') val = 5;
      if (f.level === 'very_high') val = 8;
      return sum + (val * f.weight);
    }, 0);

    if (totalRiskScore > 4.5) breakdown.overall = 'very_high';
    else if (totalRiskScore > 3.0) breakdown.overall = 'high';
    else if (totalRiskScore > 1.8) breakdown.overall = 'medium';
    else breakdown.overall = 'low';

    return breakdown;
  },

  getProbabilityTimeline: (routeId, tasks, maxHours) => {
    // If no context, return static
    if (!tasks || !maxHours) {
      return get().snapshot.probabilityTimelines.find((t) => t.routeId === routeId);
    }

    // Dynamic Monte Carlo approximation for the trajectory
    // The confidence decays or increases over time based on the active load graph
    const loads = get().getWeeklyLoads(routeId, tasks, maxHours);
    const points: ProbabilityPoint[] = [];
    
    let currentBandVal = 80; // Start at Very High theoretically if no constraints breached

    for (let i = 0; i < loads.length; i++) {
      const load = loads[i];
      // Simulate statistical decay upon hitting constraints
      if (load.overload) {
        currentBandVal -= 15; // Confidence takes a big hit on overloads
      } else if (load.plannedHours > maxHours * 0.8) {
        currentBandVal -= 5; // Slight decay under heavy strain
      } else if (load.plannedHours < maxHours * 0.5) {
         currentBandVal += 4; // Recovery during light weeks
      }

      // Bound between 0 and 100
      currentBandVal = Math.max(0, Math.min(100, currentBandVal));

      let band: ProbabilityPoint['band'] = 'very_high';
      if (currentBandVal < 20) band = 'very_low';
      else if (currentBandVal < 40) band = 'low';
      else if (currentBandVal < 60) band = 'medium';
      else if (currentBandVal < 80) band = 'high';

      points.push({
        stepIndex: i,
        band
      });
    }

    return { routeId, points };
  },

  getPeakBurnoutWeek: (routeId, tasks, maxHours) => {
    const loads = get().getWeeklyLoads(routeId, tasks, maxHours);
    const sortedByRisk = [...loads].sort((a, b) => b.plannedHours - a.plannedHours);

    if (sortedByRisk.length === 0) return null;
    
    const peak = sortedByRisk[0];
    if (peak.burnoutRisk === 'high' || peak.burnoutRisk === 'very_high') {
      return peak.weekIndex;
    }
    
    return null; // No significant burnout peak found
  },

  getCapacityEfficiencyRating: (routeId, tasks, maxHours) => {
    // Returns 0-100 indicating how well the allocated time aligns with the maximum time.
    if (!tasks || !maxHours) return 100;
    
    const loads = get().getWeeklyLoads(routeId, tasks, maxHours);
    if (loads.length === 0) return 0;

    let totalCapacity = loads.length * maxHours;
    let actualAllocation = loads.reduce((sum, l) => sum + l.plannedHours, 0);

    const efficiency = (actualAllocation / totalCapacity) * 100;
    return Math.min(100, Math.round(efficiency));
  }
}));
