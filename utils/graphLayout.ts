import { SkillNode, SkillDependency } from '../types/skill';

export interface PositionedSkillNode extends SkillNode {
  x: number;
  y: number;
  layer: number;
}

export interface SkillGraphLayout {
  nodes: PositionedSkillNode[];
}

export function layoutSkillGraph(skills: SkillNode[], dependencies: SkillDependency[]): SkillGraphLayout {
  // Mock layout algorithm for graphing
  return {
    nodes: skills.map((s, i) => ({
      ...s,
      layer: Math.floor(i / 3),
      x: (i % 3) * 250 + 100,
      y: Math.floor(i / 3) * 120 + 100,
    })),
  };
}
