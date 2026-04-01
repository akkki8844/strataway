import { create } from 'zustand';
import { AnalyticsSnapshot } from '../../types/analytics';
import { SEED_ANALYTICS } from '../../utils/seedData';

interface AnalyticsState {
  snapshot: AnalyticsSnapshot;
  activeRouteId: string;
  isLoading: boolean;

  setActiveAnalyticsRoute: (routeId: string) => void;
  getRouteAnalytics: (routeId: string) => AnalyticsSnapshot['routes'][number] | undefined;
  getRiskBreakdown: (routeId: string) => AnalyticsSnapshot['riskBreakdowns'][number] | undefined;
  getProbabilityTimeline: (routeId: string) => AnalyticsSnapshot['probabilityTimelines'][number] | undefined;
  getWeeklyLoads: (routeId: string) => AnalyticsSnapshot['weeklyLoads'];
  getOverloadWeeks: (routeId: string) => number[];
  getPeakBurnoutWeek: (routeId: string) => number | null;
}

export const useAnalyticsStore = create<AnalyticsState>()((set, get) => ({
  snapshot: SEED_ANALYTICS,
  activeRouteId: 'route_balanced',
  isLoading: false,

  setActiveAnalyticsRoute: (routeId) => set({ activeRouteId: routeId }),

  getRouteAnalytics: (routeId) =>
    get().snapshot.routes.find((r) => r.routeId === routeId),

  getRiskBreakdown: (routeId) =>
    get().snapshot.riskBreakdowns.find((r) => r.routeId === routeId),

  getProbabilityTimeline: (routeId) =>
    get().snapshot.probabilityTimelines.find((t) => t.routeId === routeId),

  getWeeklyLoads: (routeId) =>
    get().snapshot.weeklyLoads.filter((l) => l.routeId === routeId),

  getOverloadWeeks: (routeId) =>
    get()
      .snapshot.weeklyLoads.filter((l) => l.routeId === routeId && l.overload)
      .map((l) => l.weekIndex),

  getPeakBurnoutWeek: (routeId) => {
    const loads = get().snapshot.weeklyLoads.filter((l) => l.routeId === routeId);
    const highRisk = loads.filter((l) => l.burnoutRisk === 'high' || l.burnoutRisk === 'very_high');
    if (highRisk.length === 0) return null;
    return highRisk.reduce((a, b) => (a.plannedHours > b.plannedHours ? a : b)).weekIndex;
  },
}));
