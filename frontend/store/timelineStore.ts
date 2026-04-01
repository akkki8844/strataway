import { create } from 'zustand';
import { Task } from '../../types/task';
import { SEED_TASKS } from '../../utils/seedData';
import { applyWeeklyLimits, adaptTimelineForNewCapacity } from '../../utils/timelineRules';

interface TimelineState {
  tasks: Task[];
  maxHoursPerWeek: number;
  currentWeek: number;
  focusedWeek: number | null;
  isLoading: boolean;

  setMaxHours: (hours: number) => void;
  setFocusedWeek: (week: number | null) => void;
  completeTask: (taskId: string, actualHours: number) => void;
  skipTask: (taskId: string, reason: string) => void;
  rescheduleTask: (taskId: string, toWeek: number) => void;
  adaptToCapacityChange: (newMax: number) => void;
  getTasksForWeek: (week: number) => Task[];
  getCompletedCount: () => number;
  getWeekLoad: (week: number) => number;
}

export const useTimelineStore = create<TimelineState>()((set, get) => ({
  tasks: SEED_TASKS,
  maxHoursPerWeek: 15,
  currentWeek: 5,
  focusedWeek: 5,
  isLoading: false,

  setMaxHours: (hours) => set({ maxHoursPerWeek: hours }),

  setFocusedWeek: (week) => set({ focusedWeek: week }),

  completeTask: (taskId, actualHours) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.core.id === taskId
          ? { ...t, execution: { status: 'completed', actualHours, completedAt: new Date().toISOString() } }
          : t
      ),
    })),

  skipTask: (taskId, reason) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.core.id === taskId
          ? { ...t, execution: { ...t.execution, status: 'skipped' }, adjustment: { ...t.adjustment, reason } }
          : t
      ),
    })),

  rescheduleTask: (taskId, toWeek) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.core.id !== taskId) return t;
        return {
          ...t,
          core: { ...t.core, weekIndex: toWeek },
          adjustment: {
            rescheduledFromWeekIndex: t.core.weekIndex,
            rescheduledToWeekIndex: toWeek,
            reason: 'manual_reschedule',
          },
        };
      }),
    })),

  adaptToCapacityChange: (newMax) => {
    const { tasks } = get();
    const adapted = adaptTimelineForNewCapacity(tasks, newMax);
    set({ tasks: adapted, maxHoursPerWeek: newMax });
  },

  getTasksForWeek: (week) => get().tasks.filter((t) => t.core.weekIndex === week),

  getCompletedCount: () => get().tasks.filter((t) => t.execution.status === 'completed').length,

  getWeekLoad: (week) =>
    get()
      .tasks.filter((t) => t.core.weekIndex === week)
      .reduce((acc, t) => acc + t.core.estimatedHours, 0),
}));
