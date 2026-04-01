import { create } from 'zustand';
import { SEED_GOAL, SEED_ROUTES, SEED_USER, SEED_SKILL_GRAPH, SEED_MASTERY, SEED_ANALYTICS, SEED_TASKS } from '../../utils/seedData';
import { RouteGoal, RoutePlan } from '../../types/route';
import { SkillGraph, SkillMasteryState } from '../../types/skill';
import { AnalyticsSnapshot } from '../../types/analytics';
import { Task } from '../../types/task';
import { UserState } from '../../types/user';

type AppView = 'landing' | 'onboarding' | 'dashboard' | 'routes' | 'skills' | 'timeline' | 'analytics' | 'explain' | 'settings';

interface StratawayState {
  user: UserState;
  goal: RouteGoal;
  routes: RoutePlan[];
  activeRouteId: string;
  skillGraph: SkillGraph;
  skillMastery: SkillMasteryState[];
  analytics: AnalyticsSnapshot;
  tasks: Task[];
  currentView: AppView;
  sidebarOpen: boolean;
  isInitialized: boolean;

  setView: (view: AppView) => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveRoute: (routeId: string) => void;
  initialize: () => void;

  // Derived selectors
  getActiveRoute: () => RoutePlan | undefined;
  getCompletionRate: () => number;
  getWeeksElapsed: () => number;
  getCurrentWeekTasks: () => Task[];
}

export const useStratawayStore = create<StratawayState>()((set, get) => ({
  user: SEED_USER,
  goal: SEED_GOAL,
  routes: SEED_ROUTES,
  activeRouteId: 'route_balanced',
  skillGraph: SEED_SKILL_GRAPH,
  skillMastery: SEED_MASTERY,
  analytics: SEED_ANALYTICS,
  tasks: SEED_TASKS,
  currentView: 'dashboard',
  sidebarOpen: true,
  isInitialized: false,

  setView: (view) => set({ currentView: view }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveRoute: (routeId) => set({ activeRouteId: routeId }),
  initialize: () => set({ isInitialized: true }),

  getActiveRoute: () => {
    const { routes, activeRouteId } = get();
    return routes.find((r) => r.meta.id === activeRouteId);
  },

  getCompletionRate: () => {
    const { tasks } = get();
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.execution.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  },

  getWeeksElapsed: () => {
    const { tasks } = get();
    const completed = tasks.filter((t) => t.execution.status === 'completed');
    if (completed.length === 0) return 0;
    return Math.max(...completed.map((t) => t.core.weekIndex)) + 1;
  },

  getCurrentWeekTasks: () => {
    const { tasks } = get();
    const currentWeek = 5; // Simulated current week
    return tasks.filter((t) => t.core.weekIndex === currentWeek);
  },
}));
