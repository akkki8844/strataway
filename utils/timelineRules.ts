import { Task, TaskStatus } from '../types/task';

function cloneTask(task: Task): Task {
  return {
    core: { ...task.core },
    links: { ...task.links },
    execution: { ...task.execution },
    adjustment: { ...task.adjustment },
    constraints: { ...task.constraints },
  };
}

function isFlexibleStatus(status: TaskStatus): boolean {
  return status === 'planned' || status === 'skipped';
}

export function applyWeeklyLimits(tasks: Task[], maxHoursPerWeek: number): Task[] {
  const result = tasks.map(cloneTask);
  const usedByWeek = new Map<number, number>();

  for (const task of result) {
    const week = task.core.weekIndex;
    const current = usedByWeek.get(week) ?? 0;
    usedByWeek.set(week, current + task.core.estimatedHours);
  }

  for (const task of result) {
    if (!isFlexibleStatus(task.execution.status)) continue;

    let targetWeek = task.core.weekIndex;
    let hours = task.core.estimatedHours;

    while (true) {
      const used = usedByWeek.get(targetWeek) ?? 0;
      if (used + hours <= maxHoursPerWeek) {
        break;
      }
      targetWeek += 1;
    }

    const fromWeek = task.core.weekIndex;
    task.core.weekIndex = targetWeek;

    const used = usedByWeek.get(targetWeek) ?? 0;
    usedByWeek.set(targetWeek, used + hours);

    task.constraints.maxHoursPerWeek = maxHoursPerWeek;
    task.constraints.availableHoursThisWeek = Math.max(
      0,
      maxHoursPerWeek - usedByWeek.get(targetWeek)!
    );

    if (targetWeek !== fromWeek) {
      task.adjustment.rescheduledFromWeekIndex = fromWeek;
      task.adjustment.rescheduledToWeekIndex = targetWeek;
      if (!task.adjustment.reason) {
        task.adjustment.reason = 'weekly_limit';
      }
    }
  }

  return result;
}

export function adaptTimelineForNewCapacity(
  tasks: Task[],
  newMaxHoursPerWeek: number
): Task[] {
  const cloned = tasks.map(cloneTask);

  for (const task of cloned) {
    task.constraints.maxHoursPerWeek = newMaxHoursPerWeek;
    task.constraints.availableHoursThisWeek = newMaxHoursPerWeek;
  }

  const flexible = cloned.filter((t) => isFlexibleStatus(t.execution.status));
  const fixed = cloned.filter((t) => !isFlexibleStatus(t.execution.status));

  const adjustedFlexible = applyWeeklyLimits(flexible, newMaxHoursPerWeek);

  return [...fixed, ...adjustedFlexible].sort(
    (a, b) => a.core.weekIndex - b.core.weekIndex
  );
}
