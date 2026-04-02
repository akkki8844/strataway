export type TaskStatus = 'planned' | 'in_progress' | 'skipped' | 'completed';

export interface Task {
  core: {
    id: string;
    title: string;
    description: string;
    kind: string;
    weekIndex: number;
    estimatedHours: number;
  };
  links: {
    skillId: string | null;
    routeId: string;
  };
  execution: {
    status: TaskStatus;
    actualHours: number | null;
    completedAt: string | null;
  };
  adjustment: {
    rescheduledFromWeekIndex: number | null;
    skipReason: string | null;
  };
}
