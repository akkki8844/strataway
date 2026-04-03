import { create } from 'zustand';
import { Task } from '../../types/task';
import { SEED_TASKS } from '../../utils/seedData';
import { 
  adaptTimelineForNewCapacity, 
  validateManualTaskShift, 
  RescheduleResult, 
  recalculateTimeline,
  findOptimizationOpportunities
} from '../../utils/timelineRules';

/**
 * Advanced Timeline Engine Store
 * 
 * Manages the mutable state of the active route projection. Responsible for recording
 * completion events, manual shift requests, and globally recalibrating the timeline
 * against hard constraints. Incorporates an "Action History" buffer to allow safe
 * experimentation (undo/redo).
 */

interface ActionHistoryEntry {
  id: string;
  timestamp: number;
  type: 'manual_shift' | 'capacity_adaptation' | 'bulk_recalculation';
  description: string;
  previousTaskState: Task[];
}

interface TimelineState {
  // Core Data
  tasks: Task[];
  maxHoursPerWeek: number;
  currentWeek: number;
  focusedWeek: number | null;
  isLoading: boolean;
  
  // Advanced Telemetry / Buffers
  actionHistory: ActionHistoryEntry[];
  optimizationOpportunities: Task[];
  lastResultMetrics: RescheduleResult['metrics'] | null;
  hasUnsavedChanges: boolean; // Simulating need to sync with DB

  // Core Actions
  setMaxHours: (hours: number) => void;
  setFocusedWeek: (week: number | null) => void;
  completeTask: (taskId: string, actualHours: number) => void;
  skipTask: (taskId: string, skipReason: string) => void;
  
  // Complex Engine Actions
  rescheduleTask: (taskId: string, toWeek: number) => { success: boolean; messages: string[] };
  adaptToCapacityChange: (newMax: number) => void;
  autoOptimize: () => void;
  undoLastAction: () => void;

  // Accessors
  getTasksForWeek: (week: number) => Task[];
  getCompletedCount: () => number;
  getWeekLoad: (week: number) => number;
  getHistoryLogs: () => ActionHistoryEntry[];
}

export const useTimelineStore = create<TimelineState>()((set, get) => ({
  tasks: SEED_TASKS,
  maxHoursPerWeek: 15,
  currentWeek: 5, // Prototype mock
  focusedWeek: 5,
  isLoading: false,

  actionHistory: [],
  optimizationOpportunities: [],
  lastResultMetrics: null,
  hasUnsavedChanges: false,

  // ─── Environment Configuration ─────────────────────────────────────────────

  setMaxHours: (hours) => set({ maxHoursPerWeek: hours }),

  setFocusedWeek: (week) => set({ focusedWeek: week }),

  // ─── Direct State Mutations ────────────────────────────────────────────────

  completeTask: (taskId, actualHours) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.core.id === taskId
          ? { ...t, execution: { status: 'completed', actualHours, completedAt: new Date().toISOString() } }
          : t
      ),
      hasUnsavedChanges: true,
    })),

  skipTask: (taskId, skipReason) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.core.id === taskId
          ? { ...t, execution: { ...t.execution, status: 'skipped' }, adjustment: { ...t.adjustment, skipReason } }
          : t
      ),
      hasUnsavedChanges: true,
    })),

  // ─── Complex Simulation / Graph Shifting ───────────────────────────────────

  rescheduleTask: (taskId, toWeek) => {
    const state = get();
    const task = state.tasks.find(t => t.core.id === taskId);
    
    if (!task) return { success: false, messages: ['Task not found.'] };

    // 1. Validate the move against constraints and prerequisites
    const validation = validateManualTaskShift(task, toWeek, state.tasks);
    if (!validation.isValid) {
      return { success: false, messages: validation.messages };
    }

    // 2. Archive Current State (Snapshot for Undo)
    const historyEntry: ActionHistoryEntry = {
      id: `act_${Date.now()}`,
      timestamp: Date.now(),
      type: 'manual_shift',
      description: `Shifted "${task.core.title}" to target block W${toWeek}.`,
      previousTaskState: [...state.tasks]
    };

    // 3. Mutate specific task
    const updatedTasks = state.tasks.map((t) => {
      if (t.core.id !== taskId) return t;
      return {
        ...t,
        core: { ...t.core, weekIndex: toWeek },
        adjustment: {
          ...t.adjustment,
          rescheduledFromWeekIndex: t.core.weekIndex,
          rescheduledToWeekIndex: toWeek,
          skipReason: 'manual_reschedule',
        },
      };
    });

    // 4. Update the state
    set({
      tasks: updatedTasks,
      hasUnsavedChanges: true,
      actionHistory: [historyEntry, ...state.actionHistory].slice(0, 10), // Keep last 10
      optimizationOpportunities: findOptimizationOpportunities(updatedTasks, state.maxHoursPerWeek)
    });

    return { success: true, messages: [] };
  },

  adaptToCapacityChange: (newMax) => {
    const state = get();
    
    // Archive state
    const historyEntry: ActionHistoryEntry = {
      id: `act_${Date.now()}`,
      timestamp: Date.now(),
      type: 'capacity_adaptation',
      description: `Global payload capacity shifted from ${state.maxHoursPerWeek}h to ${newMax}h. Running repack...`,
      previousTaskState: [...state.tasks]
    };

    // Run Engine Simulation
    const result = recalculateTimeline(state.tasks, { maxHours: newMax });

    set({ 
      tasks: result.adaptedTasks, 
      maxHoursPerWeek: newMax,
      lastResultMetrics: result.metrics,
      hasUnsavedChanges: true,
      actionHistory: [historyEntry, ...state.actionHistory].slice(0, 10),
      optimizationOpportunities: findOptimizationOpportunities(result.adaptedTasks, newMax)
    });
  },

  autoOptimize: () => {
    const state = get();
    const ops = findOptimizationOpportunities(state.tasks, state.maxHoursPerWeek);
    if (ops.length === 0) return;

    const historyEntry: ActionHistoryEntry = {
      id: `act_${Date.now()}`,
      timestamp: Date.now(),
      type: 'bulk_recalculation',
      description: `Auto-Optimized ${ops.length} payload(s) by pulling them forward.`,
      previousTaskState: [...state.tasks]
    };

    // Attempt to pull forward
    let newTasks = [...state.tasks];
    ops.forEach(opTask => {
      // Logic from engine validation
      let moved = false;
      let targetWeek = opTask.core.weekIndex - 1;
      
      while (targetWeek > Math.max(state.currentWeek, 0) && !moved) {
        // Simple validation for prototype
        newTasks = newTasks.map(t => t.core.id === opTask.core.id ? { ...t, core: { ...t.core, weekIndex: targetWeek } } : t);
        moved = true;
      }
    });

    set({
      tasks: newTasks,
      actionHistory: [historyEntry, ...state.actionHistory].slice(0, 10),
      optimizationOpportunities: findOptimizationOpportunities(newTasks, state.maxHoursPerWeek)
    });
  },

  undoLastAction: () => {
    const state = get();
    if (state.actionHistory.length === 0) return;

    const lastAction = state.actionHistory[0];
    const remainingHistory = state.actionHistory.slice(1);

    set({
      tasks: lastAction.previousTaskState,
      actionHistory: remainingHistory,
      optimizationOpportunities: findOptimizationOpportunities(lastAction.previousTaskState, state.maxHoursPerWeek),
      lastResultMetrics: null // Invalidate metric display on undo
    });
  },

  // ─── Accessors ─────────────────────────────────────────────────────────────

  getTasksForWeek: (week) => get().tasks.filter((t) => t.core.weekIndex === week),
  
  getCompletedCount: () => get().tasks.filter((t) => t.execution.status === 'completed').length,
  
  getWeekLoad: (week) =>
    get()
      .tasks.filter((t) => t.core.weekIndex === week && t.execution.status !== 'skipped' && t.execution.status !== 'completed')
      .reduce((acc, t) => acc + t.core.estimatedHours, 0),

  getHistoryLogs: () => get().actionHistory,
}));
