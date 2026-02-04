import { SkillGraph } from '../types/skill';

export interface PositionedSkillNode {
  id: string;
  x: number;
  y: number;
  layer: number;
  indexInLayer: number;
}

export interface SkillGraphLayout {
  nodes: PositionedSkillNode[];
}

export interface LayoutOptions {
  horizontalSpacing?: number;
  verticalSpacing?: number;
}

export function layoutSkillGraph(
  graph: SkillGraph,
  options: LayoutOptions = {}
): SkillGraphLayout {
  const horizontalSpacing = options.horizontalSpacing ?? 220;
  const verticalSpacing = options.verticalSpacing ?? 120;

  const skills = graph.skills;
  const dependencies = graph.dependencies;

  const inDegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const skill of skills) {
    inDegree.set(skill.id, 0);
    outgoing.set(skill.id, []);
  }

  for (const edge of dependencies) {
    const from = edge.fromSkillId;
    const to = edge.toSkillId;
    if (!inDegree.has(from)) inDegree.set(from, 0);
    if (!inDegree.has(to)) inDegree.set(to, 0);
    inDegree.set(to, (inDegree.get(to) ?? 0) + 1);
    if (!outgoing.has(from)) outgoing.set(from, []);
    outgoing.get(from)!.push(to);
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(id);
  }

  const topoOrder: string[] = [];
  const inDegreeCopy = new Map(inDegree);

  while (queue.length > 0) {
    const current = queue.shift() as string;
    topoOrder.push(current);
    const neighbors = outgoing.get(current) ?? [];
    for (const next of neighbors) {
      const nextDegree = (inDegreeCopy.get(next) ?? 0) - 1;
      inDegreeCopy.set(next, nextDegree);
      if (nextDegree === 0) queue.push(next);
    }
  }

  const allIds = new Set(skills.map((s) => s.id));
  for (const id of allIds) {
    if (!topoOrder.includes(id)) {
      topoOrder.push(id);
    }
  }

  const layerForNode = new Map<string, number>();

  for (const id of topoOrder) {
    const incomingEdges = dependencies.filter((d) => d.toSkillId === id);
    if (incomingEdges.length === 0) {
      layerForNode.set(id, 0);
    } else {
      let maxParentLayer = 0;
      for (const edge of incomingEdges) {
        const parentLayer = layerForNode.get(edge.fromSkillId) ?? 0;
        if (parentLayer > maxParentLayer) {
          maxParentLayer = parentLayer;
        }
      }
      layerForNode.set(id, maxParentLayer + 1);
    }
  }

  const layers = new Map<number, string[]>();
  for (const id of topoOrder) {
    const layer = layerForNode.get(id) ?? 0;
    if (!layers.has(layer)) layers.set(layer, []);
    layers.get(layer)!.push(id);
  }

  const positioned: PositionedSkillNode[] = [];

  for (const [layerIndex, ids] of Array.from(layers.entries()).sort(
    (a, b) => a[0] - b[0]
  )) {
    const count = ids.length;
    const totalHeight = (count - 1) * verticalSpacing;
    const startY = -totalHeight / 2;

    ids.forEach((id, index) => {
      const x = layerIndex * horizontalSpacing;
      const y = startY + index * verticalSpacing;
      positioned.push({
        id,
        x,
        y,
        layer: layerIndex,
        indexInLayer: index,
      });
    });
  }

  return { nodes: positioned };
}
