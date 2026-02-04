export type SkillCategory =
  | 'core_concept'
  | 'supporting_concept'
  | 'tooling'
  | 'project'
  | 'meta';

export type SkillDifficulty = 'introductory' | 'intermediate' | 'advanced';

export type SkillStatus = 'locked' | 'available' | 'in_progress' | 'mastered';

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  difficulty: SkillDifficulty;
  estimatedHours: number;
}

export interface SkillDependencyEdge {
  id: string;
  fromSkillId: string;
  toSkillId: string;
  isSoft: boolean;
}

export interface SkillMasteryState {
  skillId: string;
  status: SkillStatus;
  progress: number;
}

export interface SkillGraph {
  skills: SkillNode[];
  dependencies: SkillDependencyEdge[];
}

export interface SkillProfile {
  graph: SkillGraph;
  mastery: SkillMasteryState[];
}
