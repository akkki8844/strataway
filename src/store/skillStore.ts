import { create } from 'zustand';
import { SkillGraph, SkillMasteryState, SkillStatus } from '../../types/skill';
import { SEED_SKILL_GRAPH, SEED_MASTERY } from '../../utils/seedData';
import { layoutSkillGraph, SkillGraphLayout } from '../../utils/graphLayout';

interface SkillState {
  graph: SkillGraph;
  mastery: SkillMasteryState[];
  layout: SkillGraphLayout;
  selectedSkillId: string | null;
  highlightedPath: string[];
  isLoading: boolean;

  selectSkill: (skillId: string | null) => void;
  updateMastery: (skillId: string, status: SkillStatus, progress: number) => void;
  unlockSkill: (skillId: string) => void;
  highlightDependencyPath: (skillId: string) => void;
  clearHighlight: () => void;
  getUnlockedSkillIds: () => string[];
  getSkillById: (skillId: string) => SkillGraph['skills'][number] | undefined;
  getMasteryById: (skillId: string) => SkillMasteryState | undefined;
}

export const useSkillStore = create<SkillState>()((set, get) => ({
  graph: SEED_SKILL_GRAPH,
  mastery: SEED_MASTERY,
  layout: layoutSkillGraph(SEED_SKILL_GRAPH.skills, SEED_SKILL_GRAPH.dependencies),
  selectedSkillId: null,
  highlightedPath: [],
  isLoading: false,

  selectSkill: (skillId) => set({ selectedSkillId: skillId }),

  updateMastery: (skillId, status, progress) =>
    set((state) => ({
      mastery: state.mastery.map((m) =>
        m.skillId === skillId ? { ...m, status, progress } : m
      ),
    })),

  unlockSkill: (skillId) => {
    const { mastery, graph } = get();
    const current = mastery.find((m) => m.skillId === skillId);
    if (!current || current.status !== 'locked') return;

    // Check all hard prerequisites are mastered
    const prereqs = graph.dependencies
      .filter((e) => e.toSkillId === skillId && !e.isSoft)
      .map((e) => e.fromSkillId);

    const allMet = prereqs.every((prereqId) => {
      const m = mastery.find((x) => x.skillId === prereqId);
      return m?.status === 'mastered';
    });

    if (allMet) {
      set((state) => ({
        mastery: state.mastery.map((m) =>
          m.skillId === skillId ? { ...m, status: 'available' } : m
        ),
      }));
    }
  },

  highlightDependencyPath: (skillId) => {
    const { graph } = get();
    const path: string[] = [skillId];

    // Traverse upstream
    const queue = [skillId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const parents = graph.dependencies
        .filter((e) => e.toSkillId === current)
        .map((e) => e.fromSkillId);
      for (const p of parents) {
        if (!path.includes(p)) {
          path.push(p);
          queue.push(p);
        }
      }
    }

    set({ highlightedPath: path });
  },

  clearHighlight: () => set({ highlightedPath: [] }),

  getUnlockedSkillIds: () =>
    get()
      .mastery.filter((m) => m.status !== 'locked')
      .map((m) => m.skillId),

  getSkillById: (skillId) => get().graph.skills.find((s) => s.id === skillId),

  getMasteryById: (skillId) => get().mastery.find((m) => m.skillId === skillId),
}));
