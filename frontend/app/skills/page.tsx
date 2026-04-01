'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSkillStore } from '../../store/skillStore';
import { SkillNode, SkillMasteryState, SkillStatus } from '../../../types/skill';
import { PositionedSkillNode } from '../../../utils/graphLayout';

const STATUS_COLOR: Record<SkillStatus, string> = {
  locked: 'rgba(255,255,255,0.1)',
  available: '#f59e0b',
  in_progress: '#4f8cff',
  mastered: '#22c55e',
};
const STATUS_BORDER: Record<SkillStatus, string> = {
  locked: 'rgba(255,255,255,0.12)',
  available: 'rgba(245,158,11,0.6)',
  in_progress: 'rgba(79,140,255,0.8)',
  mastered: 'rgba(34,197,94,0.8)',
};
const CATEGORY_COLOR: Record<string, string> = {
  core_concept: '#60a5fa',
  supporting_concept: '#c084fc',
  tooling: '#34d399',
  project: '#f472b6',
  meta: '#94a3b8',
};

export default function SkillsPage() {
  const {
    graph, mastery, layout, selectedSkillId, highlightedPath,
    selectSkill, highlightDependencyPath, clearHighlight, updateMastery,
  } = useSkillStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 160, y: 300 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [filter, setFilter] = useState<SkillStatus | 'all'>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Build lookup maps
  const masteryMap = new Map<string, SkillMasteryState>(mastery.map(m => [m.skillId, m]));
  const posMap = new Map<string, PositionedSkillNode>(layout.nodes.map(n => [n.id, n]));
  const skillMap = new Map<string, SkillNode>(graph.skills.map(s => [s.id, s]));

  const selectedSkill = selectedSkillId ? skillMap.get(selectedSkillId) : null;
  const selectedMastery = selectedSkillId ? masteryMap.get(selectedSkillId) : null;

  // SVG pan/zoom handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest('.skill-node-group')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ x: pan.x, y: pan.y });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: panStart.x + (e.clientX - dragStart.x), y: panStart.y + (e.clientY - dragStart.y) });
  };
  const onMouseUp = () => setIsDragging(false);
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(2.5, Math.max(0.3, z - e.deltaY * 0.001)));
  };

  const filteredNodeIds = new Set(
    layout.nodes
      .filter(n => {
        if (filter === 'all') return true;
        return masteryMap.get(n.id)?.status === filter;
      })
      .map(n => n.id)
  );

  if (!mounted) return null;

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)' }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="page-header page-header-row" style={{ marginBottom: '1rem', flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Skill Graph</h1>
          <p className="page-subtitle">
            {mastery.filter(m => m.status === 'mastered').length} mastered ·{' '}
            {mastery.filter(m => m.status === 'in_progress').length} in progress ·{' '}
            {mastery.filter(m => m.status === 'available').length} available ·{' '}
            {mastery.filter(m => m.status === 'locked').length} locked
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {(['all', 'mastered', 'in_progress', 'available', 'locked'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`button ${filter === f ? '' : 'secondary'}`}
              style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
          <div style={{ display: 'flex', gap: '0.35rem', marginLeft: '0.5rem' }}>
            <button className="button secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
              onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}>+</button>
            <button className="button secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
              onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}>−</button>
            <button className="button secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
              onClick={() => { setPan({ x: 160, y: 300 }); setZoom(1); }}>Reset</button>
          </div>
        </div>
      </div>

      {/* ── Canvas + Inspector ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, gap: '1rem', minHeight: 0 }}>
        {/* SVG Canvas */}
        <div style={{
          flex: 1, background: 'var(--bg-soft)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)', overflow: 'hidden', position: 'relative', cursor: isDragging ? 'grabbing' : 'grab',
        }}>
          {/* Legend */}
          <div style={{
            position: 'absolute', top: 16, left: 16, zIndex: 10,
            display: 'flex', flexDirection: 'column', gap: '0.35rem',
            background: 'rgba(11,14,20,0.8)', backdropFilter: 'blur(8px)',
            padding: '0.75rem', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</div>
            {Object.entries(STATUS_COLOR).map(([s, c]) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--muted)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
                {s.replace('_', ' ')}
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.35rem', paddingTop: '0.35rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Category</div>
            {Object.entries(CATEGORY_COLOR).map(([cat, c]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--muted)' }}>
                <span style={{ width: 8, height: 4, borderRadius: 2, background: c, flexShrink: 0 }} />
                {cat.replace('_', ' ')}
              </div>
            ))}
          </div>

          {/* Zoom indicator */}
          <div style={{
            position: 'absolute', bottom: 16, right: 16, zIndex: 10,
            fontSize: '0.7rem', color: 'var(--muted)',
            background: 'rgba(11,14,20,0.7)', padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-xs)', backdropFilter: 'blur(4px)',
          }}>
            {Math.round(zoom * 100)}% · Drag to pan · Scroll to zoom
          </div>

          <svg
            ref={svgRef}
            width="100%" height="100%"
            style={{ display: 'block', userSelect: 'none' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
          >
            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              {/* Edges */}
              {graph.dependencies.map(edge => {
                const from = posMap.get(edge.fromSkillId);
                const to = posMap.get(edge.toSkillId);
                if (!from || !to) return null;
                const inPath = highlightedPath.includes(edge.fromSkillId) && highlightedPath.includes(edge.toSkillId);
                const dimmed = highlightedPath.length > 0 && !inPath;
                const fMastery = masteryMap.get(edge.fromSkillId);
                const edgeColor = fMastery?.status === 'mastered' ? '#22c55e'
                  : fMastery?.status === 'in_progress' ? '#4f8cff'
                  : edge.isSoft ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.18)';

                return (
                  <g key={edge.id}>
                    <path
                      d={cubicBezier(from.x + 80, from.y, to.x, to.y)}
                      fill="none"
                      stroke={inPath ? '#4f8cff' : edgeColor}
                      strokeWidth={inPath ? 2.5 : edge.isSoft ? 1 : 1.5}
                      strokeDasharray={edge.isSoft ? '6,4' : undefined}
                      opacity={dimmed ? 0.1 : 0.7}
                      style={{ transition: 'opacity 0.2s' }}
                    />
                    {/* Arrow */}
                    <circle
                      cx={lerp(from.x + 80, to.x, 0.78)}
                      cy={lerp(from.y, to.y, 0.78)}
                      r={3}
                      fill={inPath ? '#4f8cff' : edgeColor}
                      opacity={dimmed ? 0.1 : 0.6}
                    />
                  </g>
                );
              })}

              {/* Nodes */}
              {layout.nodes.map(node => {
                const skill = skillMap.get(node.id);
                const m = masteryMap.get(node.id);
                if (!skill || !m) return null;

                const isFiltered = !filteredNodeIds.has(node.id);
                const isSelected = node.id === selectedSkillId;
                const isHighlighted = highlightedPath.includes(node.id);
                const dimmed = (highlightedPath.length > 0 && !isHighlighted) || isFiltered;

                const W = 148, H = 60;
                const status = m.status as SkillStatus;
                const catColor = CATEGORY_COLOR[skill.category] ?? '#94a3b8';

                return (
                  <g
                    key={node.id}
                    className="skill-node-group"
                    transform={`translate(${node.x},${node.y - H / 2})`}
                    style={{ opacity: dimmed ? 0.15 : 1, transition: 'opacity 0.2s', cursor: 'pointer' }}
                    onClick={() => {
                      if (isSelected) { selectSkill(null); clearHighlight(); }
                      else { selectSkill(node.id); highlightDependencyPath(node.id); }
                    }}
                  >
                    {/* Glow for selected */}
                    {isSelected && (
                      <rect x={-4} y={-4} width={W + 8} height={H + 8}
                        rx={14} fill="rgba(79,140,255,0.15)" />
                    )}
                    {/* Card */}
                    <rect x={0} y={0} width={W} height={H}
                      rx={10}
                      fill="var(--card)"
                      stroke={isSelected ? STATUS_BORDER[status] : dimmed ? 'rgba(255,255,255,0.05)' : STATUS_BORDER[status]}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    {/* Category stripe */}
                    <rect x={0} y={0} width={4} height={H} rx={4} fill={catColor} />
                    {/* Status dot */}
                    <circle cx={W - 14} cy={14} r={5} fill={STATUS_COLOR[status]} />
                    {/* Name */}
                    <text x={12} y={22} fontSize={11} fontWeight={600} fill="var(--text)" fontFamily="Inter, sans-serif">
                      {skill.name.length > 18 ? skill.name.slice(0, 17) + '…' : skill.name}
                    </text>
                    {/* Hours */}
                    <text x={12} y={38} fontSize={9} fill="var(--muted)" fontFamily="Inter, sans-serif">
                      {skill.estimatedHours}h · {skill.difficulty}
                    </text>
                    {/* Progress bar for in-progress */}
                    {status === 'in_progress' && (
                      <>
                        <rect x={12} y={46} width={W - 24} height={3} rx={2} fill="rgba(255,255,255,0.08)" />
                        <rect x={12} y={46} width={(W - 24) * (m.progress / 100)} height={3} rx={2} fill="var(--primary)" />
                      </>
                    )}
                    {/* Mastered checkmark */}
                    {status === 'mastered' && (
                      <text x={W - 14} y={38} fontSize={10} fill="#22c55e" textAnchor="middle" fontFamily="Inter, sans-serif">✓</text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Inspector panel */}
        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {selectedSkill && selectedMastery ? (
            <SkillInspector
              skill={selectedSkill}
              mastery={selectedMastery}
              dependencies={graph.dependencies.filter(e => e.toSkillId === selectedSkill.id)}
              dependents={graph.dependencies.filter(e => e.fromSkillId === selectedSkill.id)}
              skillMap={skillMap}
              masteryMap={masteryMap}
              onUpdateMastery={(status, progress) => updateMastery(selectedSkill.id, status, progress)}
            />
          ) : (
            <div className="card outline" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <div style={{ fontSize: '2rem' }}>🔗</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted)', textAlign: 'center' }}>
                Click any skill node to inspect prerequisites, progress, and unlock state
              </div>
            </div>
          )}

          {/* Graph stats */}
          <div className="card outline" style={{ flexShrink: 0 }}>
            <div className="section-title" style={{ marginBottom: '0.75rem' }}>Graph Stats</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <StatRow label="Total Skills" value={`${graph.skills.length}`} />
              <StatRow label="Dependencies" value={`${graph.dependencies.length}`} />
              <StatRow label="Hard deps" value={`${graph.dependencies.filter(e => !e.isSoft).length}`} />
              <StatRow label="Soft deps" value={`${graph.dependencies.filter(e => e.isSoft).length}`} />
              <StatRow label="Graph layers" value={`${new Set(layout.nodes.map(n => n.layer)).size}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skill Inspector ─────────────────────────────────────────────────────────

function SkillInspector({
  skill, mastery, dependencies, dependents, skillMap, masteryMap, onUpdateMastery,
}: {
  skill: SkillNode;
  mastery: SkillMasteryState;
  dependencies: { fromSkillId: string; isSoft: boolean }[];
  dependents: { toSkillId: string; isSoft: boolean }[];
  skillMap: Map<string, SkillNode>;
  masteryMap: Map<string, SkillMasteryState>;
  onUpdateMastery: (status: SkillStatus, progress: number) => void;
}) {
  const catColor = CATEGORY_COLOR[skill.category] ?? '#94a3b8';
  const statusColor = STATUS_COLOR[mastery.status as SkillStatus];

  return (
    <div className="card outline scale-in" style={{ flex: 1, overflow: 'auto' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
          <div style={{ width: 3, background: catColor, borderRadius: 2, alignSelf: 'stretch', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{skill.name}</div>
            <div style={{ fontSize: '0.72rem', color: catColor, marginTop: '0.15rem', fontWeight: 500 }}>
              {skill.category.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>{skill.description}</p>
      </div>

      {/* Metadata */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <MetaPill label="Difficulty" value={skill.difficulty} />
        <MetaPill label="Est. Hours" value={`${skill.estimatedHours}h`} />
        <MetaPill label="Status" value={mastery.status.replace('_', ' ')} color={statusColor} />
        <MetaPill label="Progress" value={`${mastery.progress}%`} />
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.3rem' }}>Mastery Progress</div>
        <div className="progress">
          <div className="progress-bar" style={{ width: `${mastery.progress}%`, background: statusColor }} />
        </div>
      </div>

      {/* Status actions */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>Update Status</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
          {(['available', 'in_progress', 'mastered'] as SkillStatus[]).map(s => (
            <button key={s} onClick={() => onUpdateMastery(s, s === 'mastered' ? 100 : mastery.progress)}
              className={`button ${mastery.status === s ? '' : 'secondary'}`}
              style={{ fontSize: '0.65rem', padding: '0.35rem 0.4rem' }}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Prerequisites */}
      {dependencies.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Requires
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {dependencies.map(d => {
              const s = skillMap.get(d.fromSkillId);
              const m = masteryMap.get(d.fromSkillId);
              if (!s) return null;
              return (
                <div key={d.fromSkillId} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-xs)',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: STATUS_COLOR[m?.status as SkillStatus ?? 'locked'] }} />
                  <span style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-soft)' }}>{s.name}</span>
                  {d.isSoft && <span style={{ fontSize: '0.6rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.35rem', borderRadius: 99 }}>soft</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unlocks */}
      {dependents.length > 0 && (
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Unlocks
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {dependents.map(d => {
              const s = skillMap.get(d.toSkillId);
              if (!s) return null;
              return (
                <span key={d.toSkillId} style={{
                  fontSize: '0.72rem', color: 'var(--primary-soft)',
                  background: 'rgba(79,140,255,0.1)', padding: '0.2rem 0.5rem',
                  borderRadius: 99,
                }}>{s.name}</span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = (x1 + x2) / 2;
  return `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function MetaPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-xs)' }}>
      <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: '0.1rem' }}>{label}</div>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: color ?? 'var(--text)' }}>{value}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{value}</span>
    </div>
  );
}
