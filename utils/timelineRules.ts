import { Task } from '../types/task';
import { RoutePlan } from '../types/route';

/**
 * Advanced Timeline Rules Engine
 * 
 * This module is responsible for the deterministic simulation and execution of timeline events.
 * It provides the core algorithms for bin-packing tasks (the "backpack problem"), resolving 
 * prerequisite dependency graphs dynamically, and simulating constraint breaches across routes.
 * 
 * DESIGN PHILOSOPHY:
 * - Immutable Transformations: All functions return new arrays. No in-place mutations.
 * - Determinism: Given the same set of tasks and the same capacity, the engine must always
 *   yield the exact same weekly task structure.
 * - Prioritized Shifting: Core concepts move before non-core. Dependent nodes force re-evaluation.
 */

// ─── Core Types for Engine ───────────────────────────────────────────────────

export interface RescheduleResult {
  adaptedTasks: Task[];
  metrics: {
    totalWeeksShifted: number;
    tasksAffected: number;
    loadViolationCount: number;
    capacityEfficiency: number;
  };
  log: Array<{
    taskId: string;
    action: string;
    originalWeek: number;
    newWeek: number;
    reason: string;
  }>;
}

export interface AdaptationOptions {
  maxHours: number;
  preserveDependencyOrder?: boolean;
  priorityWeights?: {
    core_concept: number;
    supporting_concept: number;
    tooling: number;
    project: number;
  };
  strictMode?: boolean; // If true, throws error on unsolvable graphs
}

const DEFAULT_OPTIONS: AdaptationOptions = {
  maxHours: 15,
  preserveDependencyOrder: true,
  priorityWeights: {
    core_concept: 1.5,
    supporting_concept: 1.2,
    tooling: 1.0,
    project: 2.0,
  },
  strictMode: false,
};

// ─── Utility Nodes ───────────────────────────────────────────────────────────

/**
 * Helper to identify if a task is locked by an uncompleted prerequisite globally.
 * In a fully realized system, this references the SkillGraph. For this prototype,
 * we handle topological ordering inline.
 */
function isTaskBlocked(task: Task, allTasks: Task[], currentWeek: number): boolean {
  // Prototype simplification: tasks scheduled earlier are implicit prerequisites
  // if they share the same skill node or if they are marked as foundational.
  // We'll enforce that tasks cannot be moved BEFORE their original scheduled index relative to peers.
  return false;
}

/**
 * Calculates the total load for a specific week based on the current state array.
 */
function getLoadForWeek(tasks: Task[], weekIndex: number): number {
  return tasks
    .filter(t => t.core.weekIndex === weekIndex && t.execution.status !== 'completed' && t.execution.status !== 'skipped')
    .reduce((sum, t) => sum + t.core.estimatedHours, 0);
}

// ─── Main Algorithms ─────────────────────────────────────────────────────────

/**
 * adaptTimelineForNewCapacity
 * 
 * A sophisticated bin-packing algorithm that attempts to fit tasks into weekly blocks
 * while respecting the 'maxHours' constraint.
 * 
 * ALGORITHM:
 * 1. Sort all tasks topologically (for prototype, by their initial weekIndex).
 * 2. Maintain a running sum of weekly loads.
 * 3. Iterate through tasks. If a task exceeds the current week's capacity limit,
 *    shift it to the next available week that has capacity.
 * 4. Apply a "ripple effect": if a task shifts, any subsequent task that depends
 *    on it (topologically following it) must also shift if it falls to the same week
 *    and overflows it.
 */
export function adaptTimelineForNewCapacity(
  tasks: Task[], 
  maxHours: number, 
  options: Partial<AdaptationOptions> = {}
): Task[] {
  const opts = { ...DEFAULT_OPTIONS, ...options, maxHours };
  
  // 1. Snapshot initial state and sort logically
  const sortedTasks = [...tasks].sort((a, b) => {
    // Sort primarily by week, secondarily by execution order
    if (a.core.weekIndex !== b.core.weekIndex) return a.core.weekIndex - b.core.weekIndex;
    
    // Priority tie-breaker
    const kindA = a.core.kind as keyof typeof opts.priorityWeights;
    const kindB = b.core.kind as keyof typeof opts.priorityWeights;
    const weightA = opts.priorityWeights?.[kindA] ?? 1.0;
    const weightB = opts.priorityWeights?.[kindB] ?? 1.0;
    return weightB - weightA; // Higher weight goes first
  });

  const adapted: Task[] = [];
  const weeklyLoads: Record<number, number> = {};

  // 2. Pre-fill loads with completed tasks (they cannot move)
  tasks.forEach(t => {
    if (t.execution.status === 'completed' || t.execution.status === 'skipped') {
      weeklyLoads[t.core.weekIndex] = (weeklyLoads[t.core.weekIndex] || 0) + t.core.estimatedHours;
    }
  });

  let minimumValidWeek = 0;

  // 3. Bin-pack remaining tasks
  sortedTasks.forEach((task) => {
    if (task.execution.status === 'completed' || task.execution.status === 'skipped') {
      adapted.push(task); // pass through unmodified
      return;
    }

    let targetWeek = Math.max(task.core.weekIndex, minimumValidWeek);
    let foundSlot = false;
    let iterations = 0; // Safety catch

    while (!foundSlot && iterations < 100) {
      const currentLoad = weeklyLoads[targetWeek] || 0;
      
      // Can it fit?
      if (currentLoad + task.core.estimatedHours <= opts.maxHours) {
        foundSlot = true;
      } else if (task.core.estimatedHours > opts.maxHours && currentLoad === 0) {
        // Edge case: Task itself is larger than the entire week's capacity.
        // It must be placed alone and will inevitably trigger an overload alert later.
        foundSlot = true; 
      } else {
        // Move to next week
        targetWeek++;
      }
      iterations++;
    }

    if (iterations >= 100 && opts.strictMode) {
      throw new Error(`Engine Overload: Task ${task.core.id} could not be placed.`);
    }

    // Apply the placement
    const originalWeek = task.core.weekIndex;
    weeklyLoads[targetWeek] = (weeklyLoads[targetWeek] || 0) + task.core.estimatedHours;
    
    // If we shifted, we enforce that dependent tasks (subsequent ones in the sorted list)
    // cannot be scheduled BEFORE this task.
    if (opts.preserveDependencyOrder) {
      minimumValidWeek = targetWeek;
    }

    adapted.push({
      ...task,
      core: { 
        ...task.core, 
        weekIndex: targetWeek 
      },
      adjustment: {
        ...task.adjustment,
        rescheduledFromWeekIndex: originalWeek !== targetWeek ? originalWeek : task.adjustment?.rescheduledFromWeekIndex ?? null,
        rescheduledToWeekIndex: originalWeek !== targetWeek ? targetWeek : task.adjustment?.rescheduledToWeekIndex ?? null,
        skipReason: originalWeek !== targetWeek ? 'capacity_adaptation' : task.adjustment?.skipReason ?? null,
      },
    });
  });

  // Re-sort array back to original ID order to prevent UI jumping if order matters
  // Actually, UI usually renders by weekIndex, so we return sorted topologically.
  return adapted.sort((a, b) => a.core.weekIndex - b.core.weekIndex);
}

/**
 * applyWeeklyLimits
 * 
 * Simple wrapper for legacy components that don't need the advanced options object.
 */
export function applyWeeklyLimits(tasks: Task[], maxHours: number): Task[] {
  return adaptTimelineForNewCapacity(tasks, maxHours);
}

/**
 * recalculateTimeline
 * 
 * An extensive version of adaptation that returns full metrics and execution logs
 * for the UI to display in the "Decision Log" or "Explainability Panel".
 */
export function recalculateTimeline(tasks: Task[], options: { maxHours: number }): RescheduleResult {
  const snapshotOriginal = [...tasks];
  const adaptedTasks = adaptTimelineForNewCapacity(tasks, options.maxHours);
  
  const log: RescheduleResult['log'] = [];
  let tasksAffected = 0;
  let totalWeeksShifted = 0;
  let loadViolationCount = 0;

  // Generate logs and metrics by diffing
  adaptedTasks.forEach(adaptedTask => {
    const originalTask = snapshotOriginal.find(t => t.core.id === adaptedTask.core.id);
    if (!originalTask) return;

    if (originalTask.core.weekIndex !== adaptedTask.core.weekIndex) {
      tasksAffected++;
      totalWeeksShifted += Math.abs(adaptedTask.core.weekIndex - originalTask.core.weekIndex);
      
      log.push({
        taskId: adaptedTask.core.id,
        action: 'System Auto-Shift',
        originalWeek: originalTask.core.weekIndex,
        newWeek: adaptedTask.core.weekIndex,
        reason: 'Capacity breached target zone. Repacked payload.',
      });
    }
  });

  // Calculate violations (if any task still forces a violation due to size)
  const weeklyLoads: Record<number, number> = {};
  adaptedTasks.forEach(t => {
    if (t.execution.status !== 'completed' && t.execution.status !== 'skipped') {
      weeklyLoads[t.core.weekIndex] = (weeklyLoads[t.core.weekIndex] || 0) + t.core.estimatedHours;
    }
  });

  Object.values(weeklyLoads).forEach(load => {
    if (load > options.maxHours) loadViolationCount++;
  });

  // Calculate efficiency (average load of active weeks vs maxHours)
  const activeWeeksCount = Object.keys(weeklyLoads).length;
  const totalLoad = Object.values(weeklyLoads).reduce((a, b) => a + b, 0);
  const capacityEfficiency = activeWeeksCount > 0 ? (totalLoad / (activeWeeksCount * options.maxHours)) * 100 : 0;

  return {
    adaptedTasks,
    metrics: {
      totalWeeksShifted,
      tasksAffected,
      loadViolationCount,
      capacityEfficiency: Math.min(Math.round(capacityEfficiency), 100)
    },
    log
  };
}

// ─── Extended Ruleset Functions (For Premium Interactions) ───────────────────

/**
 * Simulates a single task movement and returns validation errors if the move 
 * violates strict topological checks (e.g. moving an advanced task before a core one).
 */
export function validateManualTaskShift(
  taskToShift: Task, 
  targetWeek: number, 
  allTasks: Task[], 
  dependencies: any[] = []
): { isValid: boolean; messages: string[] } {
  const messages: string[] = [];
  let isValid = true;

  if (targetWeek < 0) {
    isValid = false;
    messages.push('Target week cannot be in the past.');
    return { isValid, messages };
  }

  if (taskToShift.execution.status === 'completed') {
    isValid = false;
    messages.push('Cannot shift an already verified/completed task.');
    return { isValid, messages };
  }

  // Find prerequisites based on actual graph data in a real environment.
  // For the prototype, if we move a task backwards in time significantly, we warn.
  const originalWeek = taskToShift.core.weekIndex;
  
  if (targetWeek < originalWeek) {
    // Check if moving it before any supporting skills could break linearity.
    // Heuristic: Is it moving before other tasks with the same skillId?
    const relatedEarlierTasks = allTasks.find(t => 
      t.links.skillId === taskToShift.links.skillId && 
      t.core.id !== taskToShift.core.id &&
      t.core.weekIndex >= targetWeek && t.core.weekIndex < originalWeek
    );

    if (relatedEarlierTasks) {
      isValid = false;
      messages.push(`Timeline Paradox: Task violates prerequisite order of ${relatedEarlierTasks.core.title}.`);
    }
  }

  return { isValid, messages };
}

/**
 * Calculates the critical path length (minimum total weeks required) given max weekly hours
 * ignoring current weekIndex placements and doing a pure front-to-back pack.
 */
export function calculateTheoreticalMinimumDuration(tasks: Task[], maxHours: number): number {
  if (maxHours <= 0) return Infinity;
  
  // Topological sort is assumed to be the order in the array
  const sorted = [...tasks].sort((a,b) => a.core.weekIndex - b.core.weekIndex);
  let currentWeek = 0;
  let currentLoad = 0;

  for (const t of sorted) {
    if (t.execution.status === 'completed' || t.execution.status === 'skipped') continue;

    if (currentLoad + t.core.estimatedHours > maxHours) {
      if (t.core.estimatedHours > maxHours && currentLoad === 0) {
        // Must go in its own week
        currentWeek++;
      } else {
        currentWeek++;
        currentLoad = t.core.estimatedHours;
      }
    } else {
      currentLoad += t.core.estimatedHours;
    }
  }

  return currentWeek;
}

/**
 * Engine Hook for finding orphaned tasks.
 * Returns tasks that are planned far into the future with no remaining prerequisites,
 * meaning they could theoretically be pulled forward.
 */
export function findOptimizationOpportunities(tasks: Task[], maxHours: number): Task[] {
  // Optimization logic: find tasks in week N where week N-1 has capacity to fit them.
  const opportunities: Task[] = [];
  
  const weeklyLoads: Record<number, number> = {};
  tasks.forEach(t => {
    if (t.execution.status !== 'completed' && t.execution.status !== 'skipped') {
      weeklyLoads[t.core.weekIndex] = (weeklyLoads[t.core.weekIndex] || 0) + t.core.estimatedHours;
    }
  });

  const activeTasks = tasks.filter(t => t.execution.status === 'planned');
  
  for (const t of activeTasks) {
    const wk = t.core.weekIndex;
    if (wk > 0) {
      const prevLoad = weeklyLoads[wk - 1] || 0;
      if (prevLoad + t.core.estimatedHours <= maxHours) {
        opportunities.push(t);
      }
    }
  }

  return opportunities;
}

// ─── Additional Payload Constants ────────────────────────────────────────────

export const ENGINE_STATUS = {
  NOMINAL: 'nominal',
  STRAINED: 'strained',
  CRITICAL: 'critical',
  HALTED: 'halted'
};

export const MAX_RECURSION_DEPTH = 500;
