export type SkillStatus = 'locked' | 'available' | 'in_progress' | 'mastered';
export type SkillCategory = 'core_concept' | 'supporting_concept' | 'tooling' | 'project' | 'meta';

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  difficulty: string;
  estimatedHours: number;
}

export interface SkillDependency {
  id: string;
  fromSkillId: string;
  toSkillId: string;
  isSoft: boolean;
}

export interface SkillGraph {
  skills: SkillNode[];
  dependencies: SkillDependency[];
}

export interface SkillMasteryState {
  skillId: string;
  status: SkillStatus;
  progress: number;
}
