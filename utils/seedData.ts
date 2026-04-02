import { SkillGraph, SkillNode, SkillDependency, SkillMasteryState } from '../types/skill';
import { RoutePlan, RouteGoal, RouteMilestone } from '../types/route';
import { AnalyticsSnapshot, WeeklyLoad, RiskBreakdown, ProbabilityTimeline } from '../types/analytics';
import { UserState } from '../types/user';
import { Task } from '../types/task';

// ─── Skill Graph Seed ───────────────────────────────────────────────────────

export const SEED_SKILLS: SkillNode[] = [
  { id: 'python_basics', name: 'Python Basics', description: 'Variables, loops, functions, OOP fundamentals', category: 'core_concept', difficulty: 'introductory', estimatedHours: 20 },
  { id: 'data_structures', name: 'Data Structures', description: 'Lists, dicts, trees, graphs in Python', category: 'core_concept', difficulty: 'intermediate', estimatedHours: 30 },
  { id: 'algorithms', name: 'Algorithms', description: 'Sorting, searching, complexity analysis', category: 'core_concept', difficulty: 'intermediate', estimatedHours: 35 },
  { id: 'statistics', name: 'Statistics & Probability', description: 'Descriptive stats, distributions, Bayes', category: 'supporting_concept', difficulty: 'intermediate', estimatedHours: 25 },
  { id: 'linear_algebra', name: 'Linear Algebra', description: 'Vectors, matrices, eigenvalues', category: 'supporting_concept', difficulty: 'advanced', estimatedHours: 30 },
  { id: 'numpy', name: 'NumPy', description: 'Numerical computing with arrays', category: 'tooling', difficulty: 'introductory', estimatedHours: 12 },
  { id: 'pandas', name: 'Pandas', description: 'Data wrangling and exploration', category: 'tooling', difficulty: 'introductory', estimatedHours: 15 },
  { id: 'matplotlib', name: 'Matplotlib & Seaborn', description: 'Data visualization fundamentals', category: 'tooling', difficulty: 'introductory', estimatedHours: 10 },
  { id: 'sklearn', name: 'Scikit-learn', description: 'Classical ML — classification, regression, clustering', category: 'tooling', difficulty: 'intermediate', estimatedHours: 30 },
  { id: 'ml_theory', name: 'ML Theory', description: 'Bias-variance, regularization, evaluation metrics', category: 'core_concept', difficulty: 'advanced', estimatedHours: 40 },
  { id: 'deep_learning', name: 'Deep Learning', description: 'Neural networks, backprop, architectures', category: 'core_concept', difficulty: 'advanced', estimatedHours: 60 },
  { id: 'pytorch', name: 'PyTorch', description: 'Tensors, autograd, training loops', category: 'tooling', difficulty: 'advanced', estimatedHours: 45 },
  { id: 'nlp', name: 'NLP Fundamentals', description: 'Tokenization, embeddings, transformers', category: 'core_concept', difficulty: 'advanced', estimatedHours: 50 },
  { id: 'sql', name: 'SQL & Databases', description: 'Queries, joins, aggregations', category: 'tooling', difficulty: 'introductory', estimatedHours: 18 },
  { id: 'capstone_project', name: 'Capstone Project', description: 'End-to-end ML project from data to deployment', category: 'project', difficulty: 'advanced', estimatedHours: 80 },
  // Adding more skills to make it comprehensive
  { id: 'docker', name: 'Docker', description: 'Containerization for models', category: 'tooling', difficulty: 'intermediate', estimatedHours: 15 },
  { id: 'cloud_basics', name: 'Cloud Basics', description: 'AWS/GCP fundamental services', category: 'tooling', difficulty: 'intermediate', estimatedHours: 20 },
  { id: 'mlops', name: 'MLOps', description: 'CI/CD for machine learning', category: 'project', difficulty: 'advanced', estimatedHours: 35 },
  { id: 'calculus', name: 'Calculus', description: 'Derivatives, gradients, optimization', category: 'supporting_concept', difficulty: 'advanced', estimatedHours: 35 },
];

export const SEED_DEPENDENCIES: SkillDependency[] = [
  { id: 'e1', fromSkillId: 'python_basics', toSkillId: 'data_structures', isSoft: false },
  { id: 'e2', fromSkillId: 'data_structures', toSkillId: 'algorithms', isSoft: false },
  { id: 'e3', fromSkillId: 'python_basics', toSkillId: 'numpy', isSoft: false },
  { id: 'e4', fromSkillId: 'numpy', toSkillId: 'pandas', isSoft: false },
  { id: 'e5', fromSkillId: 'pandas', toSkillId: 'matplotlib', isSoft: false },
  { id: 'e6', fromSkillId: 'statistics', toSkillId: 'ml_theory', isSoft: false },
  { id: 'e7', fromSkillId: 'linear_algebra', toSkillId: 'ml_theory', isSoft: false },
  { id: 'e8', fromSkillId: 'algorithms', toSkillId: 'ml_theory', isSoft: true },
  { id: 'e9', fromSkillId: 'ml_theory', toSkillId: 'sklearn', isSoft: false },
  { id: 'e10', fromSkillId: 'sklearn', toSkillId: 'deep_learning', isSoft: false },
  { id: 'e11', fromSkillId: 'ml_theory', toSkillId: 'deep_learning', isSoft: false },
  { id: 'e12', fromSkillId: 'deep_learning', toSkillId: 'pytorch', isSoft: false },
  { id: 'e13', fromSkillId: 'pytorch', toSkillId: 'nlp', isSoft: false },
  { id: 'e14', fromSkillId: 'sql', toSkillId: 'pandas', isSoft: true },
  { id: 'e15', fromSkillId: 'sklearn', toSkillId: 'capstone_project', isSoft: false },
  { id: 'e16', fromSkillId: 'nlp', toSkillId: 'capstone_project', isSoft: true },
  { id: 'e17', fromSkillId: 'calculus', toSkillId: 'deep_learning', isSoft: false },
  { id: 'e18', fromSkillId: 'docker', toSkillId: 'mlops', isSoft: false },
  { id: 'e19', fromSkillId: 'cloud_basics', toSkillId: 'mlops', isSoft: false },
  { id: 'e20', fromSkillId: 'mlops', toSkillId: 'capstone_project', isSoft: true },
];

export const SEED_SKILL_GRAPH: SkillGraph = {
  skills: SEED_SKILLS,
  dependencies: SEED_DEPENDENCIES,
};

export const SEED_MASTERY: SkillMasteryState[] = [
  { skillId: 'python_basics', status: 'mastered', progress: 100 },
  { skillId: 'data_structures', status: 'mastered', progress: 100 },
  { skillId: 'numpy', status: 'mastered', progress: 100 },
  { skillId: 'pandas', status: 'in_progress', progress: 65 },
  { skillId: 'statistics', status: 'in_progress', progress: 40 },
  { skillId: 'sql', status: 'available', progress: 0 },
  { skillId: 'matplotlib', status: 'available', progress: 0 },
  { skillId: 'algorithms', status: 'locked', progress: 0 },
  { skillId: 'linear_algebra', status: 'locked', progress: 0 },
  { skillId: 'ml_theory', status: 'locked', progress: 0 },
  { skillId: 'sklearn', status: 'locked', progress: 0 },
  { skillId: 'deep_learning', status: 'locked', progress: 0 },
  { skillId: 'pytorch', status: 'locked', progress: 0 },
  { skillId: 'nlp', status: 'locked', progress: 0 },
  { skillId: 'capstone_project', status: 'locked', progress: 0 },
  { skillId: 'docker', status: 'locked', progress: 0 },
  { skillId: 'cloud_basics', status: 'locked', progress: 0 },
  { skillId: 'mlops', status: 'locked', progress: 0 },
  { skillId: 'calculus', status: 'locked', progress: 0 },
];

// ─── Goal Seed ──────────────────────────────────────────────────────────────

export const SEED_GOAL_ID = 'goal_ml_engineer';

export const SEED_GOAL: RouteGoal = {
  id: SEED_GOAL_ID,
  title: 'Become an ML Engineer',
  description: 'Transition from software developer to ML engineer with practical project experience',
  targetOutcome: 'Ship a production ML model and land a mid-level ML engineering role',
  constraints: {
    maxHoursPerWeek: 15,
    maxBudget: 500,
    difficultyTolerance: 'medium',
    preferredProfile: 'balanced',
  },
};

// ─── Route Seeds ────────────────────────────────────────────────────────────

function makeMilestone(id: string, title: string, week: number, isCritical = true): RouteMilestone {
  return { id, title, targetWeekIndex: week, isCritical };
}

export const SEED_ROUTES: RoutePlan[] = [
  {
    meta: { id: 'route_fast', label: 'Sprint Path', profile: 'fast' },
    weeks: 24,
    milestones: [
      makeMilestone('m_fast_1', 'Stats & Math Complete', 6),
      makeMilestone('m_fast_2', 'Classical ML Mastered', 14),
      makeMilestone('m_fast_3', 'Deep Learning Intro', 20),
      makeMilestone('m_fast_4', 'Capstone Shipped', 24),
    ],
    tasks: [
      { id: 't_f1', title: 'Statistics crash course', weekIndex: 0, estimatedHours: 8, skillId: 'statistics' },
      { id: 't_f2', title: 'Linear algebra sprint', weekIndex: 1, estimatedHours: 10, skillId: 'linear_algebra' },
      { id: 't_f3', title: 'Algorithms review', weekIndex: 2, estimatedHours: 8, skillId: 'algorithms' },
      { id: 't_f4', title: 'ML Theory intensive', weekIndex: 3, estimatedHours: 12, skillId: 'ml_theory' },
      { id: 't_f5', title: 'Scikit-learn bootcamp', weekIndex: 5, estimatedHours: 14, skillId: 'sklearn' },
      { id: 't_f6', title: 'Deep learning foundations', weekIndex: 8, estimatedHours: 15, skillId: 'deep_learning' },
      { id: 't_f7', title: 'PyTorch hands-on', weekIndex: 12, estimatedHours: 14, skillId: 'pytorch' },
      { id: 't_f8', title: 'NLP project', weekIndex: 16, estimatedHours: 12, skillId: 'nlp' },
      { id: 't_f9', title: 'Capstone project', weekIndex: 20, estimatedHours: 16, skillId: 'capstone_project' },
    ],
    cost: { totalHours: 109, totalCost: 0 },
  },
  {
    meta: { id: 'route_balanced', label: 'Balanced Path', profile: 'balanced' },
    weeks: 36,
    milestones: [
      makeMilestone('m_bal_1', 'Foundations Solid', 8),
      makeMilestone('m_bal_2', 'Data Proficiency', 14),
      makeMilestone('m_bal_3', 'Classical ML Done', 22),
      makeMilestone('m_bal_4', 'Deep Learning Applied', 30),
      makeMilestone('m_bal_5', 'Capstone Complete', 36),
    ],
    tasks: [
      { id: 't_b1', title: 'SQL & data foundations', weekIndex: 0, estimatedHours: 6, skillId: 'sql' },
      { id: 't_b2', title: 'Pandas deep dive', weekIndex: 2, estimatedHours: 7, skillId: 'pandas' },
      { id: 't_b3', title: 'Matplotlib & visualization', weekIndex: 4, estimatedHours: 5, skillId: 'matplotlib' },
      { id: 't_b4', title: 'Statistics & probability', weekIndex: 5, estimatedHours: 8, skillId: 'statistics' },
      { id: 't_b5', title: 'Linear algebra', weekIndex: 7, estimatedHours: 8, skillId: 'linear_algebra' },
      { id: 't_b6', title: 'Algorithms fundamentals', weekIndex: 9, estimatedHours: 8, skillId: 'algorithms' },
      { id: 't_b7', title: 'ML Theory core', weekIndex: 11, estimatedHours: 10, skillId: 'ml_theory' },
      { id: 't_b8', title: 'Scikit-learn project', weekIndex: 14, estimatedHours: 10, skillId: 'sklearn' },
      { id: 't_b9', title: 'Deep learning theory', weekIndex: 18, estimatedHours: 12, skillId: 'deep_learning' },
      { id: 't_b10', title: 'PyTorch practice', weekIndex: 22, estimatedHours: 12, skillId: 'pytorch' },
      { id: 't_b11', title: 'NLP mini project', weekIndex: 26, estimatedHours: 10, skillId: 'nlp' },
      { id: 't_b12', title: 'Capstone planning & build', weekIndex: 30, estimatedHours: 14, skillId: 'capstone_project' },
    ],
    cost: { totalHours: 110, totalCost: 0 },
  },
  {
    meta: { id: 'route_safe', label: 'Safe Path', profile: 'safe' },
    weeks: 52,
    milestones: [
      makeMilestone('m_safe_1', 'Programming Confident', 10),
      makeMilestone('m_safe_2', 'Math Complete', 20),
      makeMilestone('m_safe_3', 'Data Skills', 28),
      makeMilestone('m_safe_4', 'Classical ML Mastered', 38),
      makeMilestone('m_safe_5', 'Deep Learning Ready', 46),
      makeMilestone('m_safe_6', 'Project Shipped', 52),
    ],
    tasks: [
      { id: 't_s1', title: 'Python review & deepening', weekIndex: 0, estimatedHours: 5, skillId: 'python_basics' },
      { id: 't_s2', title: 'Data structures thorough', weekIndex: 3, estimatedHours: 6, skillId: 'data_structures' },
      { id: 't_s3', title: 'Algorithms slow & deep', weekIndex: 6, estimatedHours: 7, skillId: 'algorithms' },
      { id: 't_s4', title: 'SQL comprehensive', weekIndex: 8, estimatedHours: 6, skillId: 'sql' },
      { id: 't_s5', title: 'Statistics with exercises', weekIndex: 10, estimatedHours: 8, skillId: 'statistics' },
      { id: 't_s6', title: 'Linear algebra step-by-step', weekIndex: 14, estimatedHours: 8, skillId: 'linear_algebra' },
      { id: 't_s7', title: 'Numpy & Pandas mastery', weekIndex: 18, estimatedHours: 7, skillId: 'pandas' },
      { id: 't_s8', title: 'Visualization skills', weekIndex: 21, estimatedHours: 5, skillId: 'matplotlib' },
      { id: 't_s9', title: 'ML theory thorough reading', weekIndex: 24, estimatedHours: 10, skillId: 'ml_theory' },
      { id: 't_s10', title: 'Scikit-learn all modules', weekIndex: 28, estimatedHours: 10, skillId: 'sklearn' },
      { id: 't_s11', title: 'Deep learning theory slow', weekIndex: 33, estimatedHours: 10, skillId: 'deep_learning' },
      { id: 't_s12', title: 'PyTorch structured course', weekIndex: 38, estimatedHours: 10, skillId: 'pytorch' },
      { id: 't_s13', title: 'NLP study & practice', weekIndex: 43, estimatedHours: 8, skillId: 'nlp' },
      { id: 't_s14', title: 'Capstone project extended', weekIndex: 47, estimatedHours: 12, skillId: 'capstone_project' },
    ],
    cost: { totalHours: 112, totalCost: 0 },
  },
  {
    meta: { id: 'route_prestige', label: 'Prestige Path', profile: 'prestige' },
    weeks: 48,
    milestones: [
      makeMilestone('m_p1', 'Research-Grade Math', 12),
      makeMilestone('m_p2', 'Classical ML Expert', 24),
      makeMilestone('m_p3', 'DL Research Depth', 36),
      makeMilestone('m_p4', 'Published-Quality Project', 48),
    ],
    tasks: [
      { id: 't_p1', title: 'Advanced statistics & experiments', weekIndex: 0, estimatedHours: 10, skillId: 'statistics' },
      { id: 't_p2', title: 'Deep linear algebra', weekIndex: 3, estimatedHours: 12, skillId: 'linear_algebra' },
      { id: 't_p3', title: 'Advanced algorithms + complexity', weekIndex: 6, estimatedHours: 12, skillId: 'algorithms' },
      { id: 't_p4', title: 'ML theory from first principles', weekIndex: 10, estimatedHours: 14, skillId: 'ml_theory' },
      { id: 't_p5', title: 'Scikit-learn + benchmarking', weekIndex: 14, estimatedHours: 12, skillId: 'sklearn' },
      { id: 't_p6', title: 'Deep learning papers + practice', weekIndex: 18, estimatedHours: 16, skillId: 'deep_learning' },
      { id: 't_p7', title: 'PyTorch research workflows', weekIndex: 24, estimatedHours: 14, skillId: 'pytorch' },
      { id: 't_p8', title: 'Transformers & NLP research', weekIndex: 30, estimatedHours: 16, skillId: 'nlp' },
      { id: 't_p9', title: 'Capstone: research-quality project', weekIndex: 38, estimatedHours: 20, skillId: 'capstone_project' },
    ],
    cost: { totalHours: 126, totalCost: 200 },
  },
];

// ─── Analytics Seed ─────────────────────────────────────────────────────────

export const SEED_WEEKLY_LOADS: WeeklyLoad[] = Array.from({ length: 36 }, (_, i) => {
  const planned = 8 + Math.sin(i * 0.4) * 4 + Math.random() * 2;
  const max = 15;
  const overload = planned > max * 0.9;
  return {
    routeId: 'route_balanced',
    weekIndex: i,
    plannedHours: Math.round(planned * 10) / 10,
    maxHours: max,
    burnoutRisk: planned > 14 ? 'high' : planned > 11 ? 'medium' : 'low',
    overload,
  };
});

export const SEED_PROBABILITY_TIMELINE: ProbabilityTimeline = {
  routeId: 'route_balanced',
  points: Array.from({ length: 36 }, (_, i) => ({
    stepIndex: i,
    band: i < 8 ? 'medium' : i < 18 ? 'medium' : i < 28 ? 'high' : 'very_high',
  })),
};

export const SEED_RISK_BREAKDOWN: RiskBreakdown = {
  routeId: 'route_balanced',
  overall: 'medium',
  factors: [
    { id: 'rf1', label: 'Time Commitment', description: '15h/wk is achievable but requires discipline', level: 'medium', weight: 0.3, domain: 'time' },
    { id: 'rf2', label: 'Prerequisite Gaps', description: 'Some gaps in linear algebra may slow ML theory', level: 'medium', weight: 0.25, domain: 'prerequisites' },
    { id: 'rf3', label: 'Consistency Risk', description: 'Long programs require sustained motivation', level: 'high', weight: 0.25, domain: 'consistency' },
    { id: 'rf4', label: 'Difficulty Curve', description: 'Deep learning jump is steep without strong math', level: 'medium', weight: 0.15, domain: 'difficulty' },
    { id: 'rf5', label: 'External Factors', description: 'Life events could disrupt rhythm', level: 'low', weight: 0.05, domain: 'external' },
  ],
};

export const SEED_ANALYTICS: AnalyticsSnapshot = {
  routes: [
    { routeId: 'route_fast', pace: 'fast', estimatedWeeks: 24, totalEffortHours: 109, totalCost: 0, risk: 'high', sustainability: 'stable', currentConfidence: 'medium' },
    { routeId: 'route_balanced', pace: 'balanced', estimatedWeeks: 36, totalEffortHours: 110, totalCost: 0, risk: 'medium', sustainability: 'stable', currentConfidence: 'high' },
    { routeId: 'route_safe',  pace: 'safe', estimatedWeeks: 52, totalEffortHours: 112, totalCost: 0, risk: 'low', sustainability: 'stable', currentConfidence: 'very_high' },
    { routeId: 'route_prestige', pace: 'prestige', estimatedWeeks: 48, totalEffortHours: 126, totalCost: 200, risk: 'medium', sustainability: 'stretch', currentConfidence: 'high' },
  ],
  probabilityTimelines: [SEED_PROBABILITY_TIMELINE],
  riskBreakdowns: [SEED_RISK_BREAKDOWN],
  weeklyLoads: SEED_WEEKLY_LOADS,
};

// ─── User Seed ───────────────────────────────────────────────────────────────

export const SEED_USER: UserState = {
  profile: {
    id: 'user_01',
    name: 'Alex Chen',
    email: 'alex@strataway.app',
    createdAt: '2024-01-15',
  },
  constraints: {
    maxHoursPerWeek: 15,
    maxBudget: 500,
    difficultyTolerance: 'medium',
    preferredProgress: 'balanced',
  },
  display: {
    theme: 'dark',
    showAdvancedAnalytics: true,
    explanationDetail: 'standard',
  },
  goals: [
    {
      goalId: SEED_GOAL_ID,
      activeRouteId: 'route_balanced',
      pinnedRouteIds: ['route_balanced', 'route_fast'],
      excludedRouteIds: [],
    },
  ],
  activeGoalId: SEED_GOAL_ID,
};

// ─── Task Seed ───────────────────────────────────────────────────────────────

export const SEED_TASKS: Task[] = [
  {
    core: { id: 'task_01', title: 'SQL & data foundations', description: 'Complete SQL module covering DML, DDL, joins, subqueries', kind: 'study', estimatedHours: 6, weekIndex: 0 },
    links: { skillId: 'sql', routeId: 'route_balanced' },
    execution: { status: 'completed', actualHours: 5.5, completedAt: '2024-01-22' },
    adjustment: { rescheduledFromWeekIndex: null, rescheduledToWeekIndex: null, skipReason: null },
  },
  {
    core: { id: 'task_02', title: 'Pandas deep dive', description: 'DataFrames, groupby, merge, pivot tables, apply functions', kind: 'study', estimatedHours: 7, weekIndex: 2 },
    links: { skillId: 'pandas', routeId: 'route_balanced' },
    execution: { status: 'completed', actualHours: 8, completedAt: '2024-02-05' },
    adjustment: { rescheduledFromWeekIndex: null, rescheduledToWeekIndex: null, skipReason: null },
  },
  {
    core: { id: 'task_03', title: 'Statistics & probability', description: 'Descriptive stats, distributions, hypothesis testing, Bayes theorem', kind: 'study', estimatedHours: 8, weekIndex: 5 },
    links: { skillId: 'statistics', routeId: 'route_balanced' },
    execution: { status: 'in_progress', actualHours: 3, completedAt: null },
    adjustment: { rescheduledFromWeekIndex: null, rescheduledToWeekIndex: null, skipReason: null },
  },
  {
    core: { id: 'task_04', title: 'Matplotlib & Seaborn visualization', description: 'Charts, plots, statistical visualization patterns', kind: 'practice', estimatedHours: 5, weekIndex: 4 },
    links: { skillId: 'matplotlib', routeId: 'route_balanced' },
    execution: { status: 'planned', actualHours: null, completedAt: null },
    adjustment: { rescheduledFromWeekIndex: null, rescheduledToWeekIndex: null, skipReason: null },
  },
  {
    core: { id: 'task_05', title: 'Linear algebra', description: 'Vectors, matrices, transformations, eigendecomposition', kind: 'study', estimatedHours: 8, weekIndex: 7 },
    links: { skillId: 'linear_algebra', routeId: 'route_balanced' },
    execution: { status: 'planned', actualHours: null, completedAt: null },
    adjustment: { rescheduledFromWeekIndex: null, rescheduledToWeekIndex: null, skipReason: null },
  },
];

// ─── Decision Log Seed ───────────────────────────────────────────────────────

export interface DecisionLogEntry {
  id: string;
  timestamp: string;
  trigger: 'route_selected' | 'task_missed' | 'capacity_changed' | 'goal_updated' | 'milestone_reached';
  summary: string;
  reasoning: string;
  affectedWeeks: number[];
  routeId: string | null;
}

export const SEED_DECISION_LOG: DecisionLogEntry[] = [
  {
    id: 'dl_01',
    timestamp: '2024-01-15T10:00:00Z',
    trigger: 'route_selected',
    summary: 'Balanced route selected as primary path',
    reasoning: 'User constraint: 15h/week with medium difficulty tolerance. Fast route exceeds sustainable load (4.5h/wk avg). Safe route requires 52 weeks which exceeds the 8-month preference. Balanced route at 36 weeks with 3h/wk avg is optimal.',
    affectedWeeks: [],
    routeId: 'route_balanced',
  },
  {
    id: 'dl_02',
    timestamp: '2024-02-05T14:32:00Z',
    trigger: 'milestone_reached',
    summary: 'Milestone "Data Proficiency" reached on schedule',
    reasoning: 'Task completion rate: 100% for weeks 0-8. SQL and Pandas modules completed within time budget. Confidence band upgraded from medium to high for remaining route.',
    affectedWeeks: [8, 9, 10, 11],
    routeId: 'route_balanced',
  },
  {
    id: 'dl_03',
    timestamp: '2024-02-20T09:15:00Z',
    trigger: 'capacity_changed',
    summary: 'Week 8 capacity reduced to 8h — timeline shifted',
    reasoning: 'User reported 8h availability for week 8 (was 15h). Statistics task rescheduled from week 5 to week 6. Downstream tasks shifted +1 week. Milestone "Foundations Solid" moved from week 8 to week 9. No critical path impact detected.',
    affectedWeeks: [5, 6, 7, 8, 9],
    routeId: 'route_balanced',
  },
];
