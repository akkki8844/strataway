import { create } from 'zustand';
import { RoutePlan, RouteComparisonSet } from '../../types/route';
import { SEED_ROUTES, SEED_GOAL } from '../../utils/seedData';

interface RouteState {
  activeRouteId: string | null;
  routes: RoutePlan[];
  comparisonSet: RouteComparisonSet | null;
  isLoading: boolean;
  error: string | null;

  setActiveRoute: (routeId: string) => void;
  loadRoutes: () => void;
  pinRoute: (routeId: string) => void;
  unpinRoute: (routeId: string) => void;
  pinnedRouteIds: string[];
}

export const useRouteStore = create<RouteState>()((set) => ({
  activeRouteId: 'route_balanced',
  routes: SEED_ROUTES,
  comparisonSet: { goal: SEED_GOAL, routes: SEED_ROUTES },
  isLoading: false,
  error: null,
  pinnedRouteIds: ['route_balanced', 'route_fast'],

  setActiveRoute: (routeId) => set({ activeRouteId: routeId }),

  loadRoutes: () => {
    set({ isLoading: true });
    // Simulate async load
    setTimeout(() => {
      set({
        routes: SEED_ROUTES,
        comparisonSet: { goal: SEED_GOAL, routes: SEED_ROUTES },
        isLoading: false,
      });
    }, 400);
  },

  pinRoute: (routeId) =>
    set((state) => ({
      pinnedRouteIds: state.pinnedRouteIds.includes(routeId)
        ? state.pinnedRouteIds
        : [...state.pinnedRouteIds, routeId],
    })),

  unpinRoute: (routeId) =>
    set((state) => ({
      pinnedRouteIds: state.pinnedRouteIds.filter((id) => id !== routeId),
    })),
}));

export const useActiveRoute = () => {
  const { routes, activeRouteId } = useRouteStore();
  return routes.find((r) => r.meta.id === activeRouteId) ?? null;
};
