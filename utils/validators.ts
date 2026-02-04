import { UserState } from '../types/user';
import { RoutePlan, RouteGoal, WeeklyTask } from '../types/route';
import { SkillGraph } from '../types/skill';
import { Task } from '../types/task';

export interface ValidationIssue {
  code: string;
  message: string;
  context?: Record<string, string | number | boolean | null>;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

function resultFromIssues(issues: ValidationIssue[]): ValidationResult {
  return { ok: issues.length === 0, issues };
}

export function validateUserState(state: UserState): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (state.constraints.maxHoursPerWeek <= 0) {
    issues.push({
      code: 'user.max_hours_non_positive',
      message: 'Max hours per week must be positive.',
    });
  }

  if (state.constraints.maxBudget !== null && state.constraints.maxBudget < 0) {
    issues.push({
      code: 'user.budget_negative',
      message: 'Budget cannot be negative.',
    });
  }

  const goalIds = new Set(state.goals.map((g) => g.goalId));
  if (state.activeGoalId && !goalIds.has(state.activeGoalId)) {
    issues.push({
      code: 'user.active_goal_missing',
      message: 'Active goal is not present in user goals.',
      context: { activeGoalId: state.activeGoalId },
    });
  }

  return resultFromIssues(issues);
}

export function validateSkillGraph(graph: SkillGraph): ValidationResult {
  const issues: ValidationIssue[] = [];

  const ids = new Set(graph.skills.map((s) => s.id));
  if (ids.size !== graph.skills.length) {
    issues.push({
      code: 'skill.duplicate_ids',
      message: 'Skill graph contains duplicate skill ids.',
    });
  }

  for (const edge of graph.dependencies) {
    if (!ids.has(edge.fromSkillId) || !ids.has(edge.toSkillId)) {
      issues.push({
        code: 'skill.edge_missing_node',
        message: 'Dependency references a missing skill.',
        context: {
          edgeId: edge.id,
          fromSkillId: edge.fromSkillId,
          toSkillId: edge.toSkillId,
        },
      });
    }
  }

  return resultFromIssues(issues);
}

export function validateRoutePlan(route: RoutePlan): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (route.weeks <= 0) {
    issues.push({
      code: 'route.non_positive_weeks',
      message: 'Route must span at least one week.',
      context: { weeks: route.weeks },
    });
  }

  const milestoneIds = new Set(route.milestones.map((m) => m.id));

  for (const task of route.tasks as WeeklyTask[]) {
    if (task.weekIndex < 0 || task.weekIndex >= route.weeks) {
      issues.push({
        code: 'route.task_out_of_range',
        message: 'Task week index is outside route duration.',
        context: {
          taskId: task.id,
          weekIndex: task.weekIndex,
          weeks: route.weeks,
        },
      });
    }

    if (task.milestoneId && !milestoneIds.has(task.milestoneId)) {
      issues.push({
        code: 'route.task_milestone_missing',
        message: 'Task references a missing milestone.',
        context: {
          taskId: task.id,
          milestoneId: task.milestoneId,
        },
      });
    }
  }

  return resultFromIssues(issues);
}

export function validateGoalConsistency(goal: RouteGoal, routes: RoutePlan[]): ValidationResult {
  const issues: ValidationIssue[] = [];

  for (const route of routes) {
    if (route.goal.id !== goal.id) {
      issues.push({
        code: 'goal.route_goal_mismatch',
        message: 'Route is linked to a different goal.',
        context: {
          goalId: goal.id,
          routeGoalId: route.goal.id,
          routeId: route.meta.id,
        },
      });
    }
  }

  return resultFromIssues(issues);
}

export function validateTasks(tasks: Task[]): ValidationResult {
  const issues: ValidationIssue[] = [];

  for (const task of tasks) {
    if (task.core.estimatedHours <= 0) {
      issues.push({
        code: 'task.non_positive_hours',
        message: 'Task estimated hours must be positive.',
        context: { taskId: task.core.id },
      });
    }

    if (task.core.weekIndex < 0) {
      issues.push({
        code: 'task.negative_week_index',
        message: 'Task week index cannot be negative.',
        context: { taskId: task.core.id, weekIndex: task.core.weekIndex },
      });
    }
  }

  return resultFromIssues(issues);
}
