export function adaptTimelineForNewCapacity(tasks: any[], maxHours: number) {
  // Logic to redistribute tasks so no week exceeds maxHours
  // This is a simplified version of a bin-packing/scheduling algorithm
  const sortedTasks = [...tasks].sort((a, b) => a.core.weekIndex - b.core.weekIndex);
  const adapted: any[] = [];
  const weeklyLoads: Record<number, number> = { 0: 0 };

  sortedTasks.forEach((task) => {
    let week = task.core.weekIndex;
    // Find the first week from the task's current week onwards that has enough capacity
    while ((weeklyLoads[week] || 0) + task.core.estimatedHours > maxHours) {
      week++;
    }
    
    const originalWeek = task.core.weekIndex;
    weeklyLoads[week] = (weeklyLoads[week] || 0) + task.core.estimatedHours;
    
    adapted.push({
      ...task,
      core: { 
        ...task.core, 
        weekIndex: week 
      },
      adjustment: {
        ...task.adjustment,
        rescheduledFromWeekIndex: originalWeek !== week ? originalWeek : task.adjustment?.rescheduledFromWeekIndex ?? null,
        rescheduledToWeekIndex: originalWeek !== week ? week : task.adjustment?.rescheduledToWeekIndex ?? null,
        reason: originalWeek !== week ? 'capacity_adaptation' : task.adjustment?.reason ?? null,
      },
    });
  });

  return adapted;
}

export function applyWeeklyLimits(tasks: any[], maxHours: number) {
  // Delegate to adaptation logic
  return adaptTimelineForNewCapacity(tasks, maxHours);
}

export function recalculateTimeline(tasks: any[], options: { maxHours: number }) {
  // Ensure the whole timeline remains within constraints
  return adaptTimelineForNewCapacity(tasks, options.maxHours);
}
