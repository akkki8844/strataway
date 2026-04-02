import { create } from 'zustand';
import { AnalyticsSnapshot, RouteAnalyticsSummary, WeeklyLoad } from '../../types/analytics';
import { SEED_ANALYTICS } from '../../utils/seedData';
import { Task } from '../../types/task';

interface AnalyticsState {
  snapshot: AnalyticsSnapshot;
  activeRouteId: string;
  isLoading: boolean;

  setActiveAnalyticsRoute: (routeId: string) => void;
  getRouteAnalytics: (routeId: string, tasks?: Task[], maxHours?: number) => RouteAnalyticsSummary | undefined;
  getWeeklyLoads: (routeId: string, tasks?: Task[], maxHours?: number) => WeeklyLoad[];
  getOverloadWeeks: (routeId: string, tasks?: Task[], maxHours?: number) => number[];
}

export const useAnalyticsStore = create<AnalyticsState>()((set, get) => ({
  snapshot: SEED_ANALYTICS,
  activeRouteId: 'route_balanced',
  isLoading: false,

  setActiveAnalyticsRoute: (routeId) => set({ activeRouteId: routeId }),

  getRouteAnalytics: (routeId, tasks, maxHours) => {
    const base = get().snapshot.routes.find((r) => r.routeId === routeId);
    if (!base) return undefined;
    if (!tasks || !maxHours) return base;

    // Dynamic calculation for prototype
    const overloads = get().getOverloadWeeks(routeId, tasks, maxHours);
    const risk: RouteAnalyticsSummary['risk'] = overloads.length > 5 ? 'very_high' : overloads.length > 2 ? 'high' : overloads.length > 0 ? 'medium' : 'low';
    const confidence: RouteAnalyticsSummary['currentConfidence'] = overloads.length > 3 ? 'low' : overloads.length > 0 ? 'medium' : 'high';

    return { 
      ...base, 
      risk, 
      currentConfidence: confidence,
      sustainability: overloads.length > 0 ? 'strained' : 'stable'
    };
  },

  getWeeklyLoads: (routeId, tasks, maxHours) => {
    if (!tasks || !maxHours) {
      return get().snapshot.weeklyLoads.filter((l) => l.routeId === routeId);
    }

    // Dynamic load calculation
    const loadsMap = new Map<number, number>();
    tasks.forEach(t => {
      const w = t.core.weekIndex;
      loadsMap.set(w, (loadsMap.get(w) ?? 0) + t.core.estimatedHours);
    });

    const maxWeek = Math.max(...tasks.map(t => t.core.weekIndex), 20);
    const loads: WeeklyLoad[] = [];
    for (let i = 0; i <= maxWeek; i++) {
        const planned = loadsMap.get(i) ?? 0;
        loads.push({
            routeId,
            weekIndex: i,
            plannedHours: planned,
            maxHours,
            overload: planned > maxHours,
            burnoutRisk: planned > maxHours * 1.2 ? 'high' : planned > maxHours ? 'medium' : 'low'
        });
    }
    return loads;
  },

  getOverloadWeeks: (routeId, tasks, maxHours) => {
    return get().getWeeklyLoads(routeId, tasks, maxHours)
      .filter(l => l.overload)
      .map(l => l.weekIndex);
  },
}));
