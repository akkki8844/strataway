export type TaskStatus = 'planned' | 'in_progress' | 'completed' | 'skipped';

export type TaskKind = 'study' | 'practice' | 'project' | 'review' | 'assessment';

export interface TaskConstraintSnapshot {
  maxHoursPerWeek: number;
  availableHoursThisWeek: number;
}

export interface TaskCore {
  id: string;
  title: string;
  description: string;
  kind: TaskKind;
  estimatedHours: number;
  weekIndex: number;
}

export interface TaskLinking {
  skillId: string | null;
  milestoneId: string | null;
  routeId: string | null;
  goalId: string | null;
}

export interface TaskExecutionState {
  status: TaskStatus;
  actualHours: number | null;
  completedAt: string | null;
}

export interface TaskAdjustment {
  rescheduledFromWeekIndex: number | null;
  rescheduledToWeekIndex: number | null;
  reason: string | null;
}

export interface Task {
  core: TaskCore;
  links: TaskLinking;
  execution: TaskExecutionState;
  adjustment: TaskAdjustment;
  constraints: TaskConstraintSnapshot;
}
