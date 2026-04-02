'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSkillStore } from '../../store/skillStore';
import { SkillNode, SkillMasteryState, SkillStatus } from '../../../types/skill';
import { PositionedSkillNode } from '../../../utils/graphLayout';

const STATUS_COLOR: Record<SkillStatus, string> = {
  locked: 'rgba(255,255,255,0.08)',
  available: 'var(--warning)',
  in_progress: 'var(--primary)',
  mastered: 'var(--success)',
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
  const [pan, setPan] = useState({ x: 200, y: 300 });
  const [zoom, setZoom] = useState(0.85);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [filter, setFilter] = useState<SkillStatus | 'all'>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const masteryMap = new Map<string, SkillMasteryState>(mastery.map(m => [m.skillId, m]));
  const posMap = new Map<string, PositionedSkillNode>(layout.nodes.map(n => [n.id, n]));
  const skillMap = new Map<string, SkillNode>(graph.skills.map(s => [s.id, s]));

  const selectedSkill = selectedSkillId ? skillMap.get(selectedSkillId) : null;
  const selectedMastery = selectedSkillId ? masteryMap.get(selectedSkillId) : null;

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
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(2.5, Math.max(0.2, z * factor)));
  };

  const filteredNodeIds = new Set(
    layout.nodes
      .filter((n: PositionedSkillNode) => {
        if (filter === 'all') return true;
        return masteryMap.get(n.id)?.status === filter;
      })
      .map((n: PositionedSkillNode) => n.id)
  );

  if (!mounted) return null;

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)' }}>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="page-header page-header-row" style={{ flexShrink: 0, marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title text-gradient">Skill Navigation</h1>
          <p className="page-subtitle">Understand the architectural dependencies of your growth path.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div className="glass" style={{ padding: '0.25rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.25rem' }}>
            {(['all', 'mastered', 'in_progress', 'available', 'locked'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`button ${filter === f ? '' : 'ghost'}`}
                style={{ fontSize: '0.72rem', padding: '0.4rem 0.8rem', whiteSpace: 'nowrap' }}>
                {f === 'all' ? 'All' : f.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
            <button className="button secondary" onClick={() => setZoom(z => Math.min(2.5, z * 1.2))}>+</button>
            <button className="button secondary" onClick={() => setZoom(z => Math.max(0.2, z / 1.2))}>−</button>
            <button className="button secondary" onClick={() => { setPan({ x: 200, y: 300 }); setZoom(0.85); }}>Reset</button>
          </div>
        </div>
      </div>

      {/* ── Main Layout ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, gap: '2rem', minHeight: 0 }}>
        {/* SVG Viewport */}
        <div style={{ 
          flex: 1, position: 'relative', background: 'var(--bg-soft)', 
          borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)',
          overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab'
        }}>
          {/* Legend Overlay */}
          <div className="glass" style={{ 
            position: 'absolute', top: '1.5rem', left: '1.5rem', 
            padding: '1rem', borderRadius: 'var(--radius-lg)', zIndex: 10,
            width: '160px'
          }}>
            <div className="section-title" style={{ fontSize: '0.625rem', marginBottom: '0.75rem' }}>Status Guide</div>
            {Object.entries(STATUS_COLOR).map(([s, c]) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c }} />
                <span style={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</span>
              </div>
            ))}
          </div>

          <svg
            ref={svgRef} width="100%" height="100%"
            onMouseDown={onMouseDown} onMouseMove={onMouseMove}
            onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            onWheel={onWheel}
            style={{ display: 'block', background: 'none' }}
          >
            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              {/* Connection Edges */}
              {graph.dependencies.map(edge => {
                const from = posMap.get(edge.fromSkillId);
                const to = posMap.get(edge.toSkillId);
                if (!from || !to) return null;

                const isHighlighted = highlightedPath.includes(edge.fromSkillId) && highlightedPath.includes(edge.toSkillId);
                const isDimmed = highlightedPath.length > 0 && !isHighlighted;
                
                return (
                  <path
                    key={edge.id}
                    d={`M${from.x + 80},${from.y} C${from.x + 160},${from.y} ${to.x - 80},${to.y} ${to.x},${to.y}`}
                    fill="none"
                    stroke={isHighlighted ? 'var(--primary)' : 'var(--border-strong)'}
                    strokeWidth={isHighlighted ? 3 : 1.5}
                    strokeDasharray={edge.isSoft ? '6,4' : '0'}
                    opacity={isDimmed ? 0.05 : 0.6}
                    style={{ transition: 'all 0.3s' }}
                  />
                );
              })}

              {/* Skill Nodes */}
              {layout.nodes.map((node: PositionedSkillNode) => {
                const skill = skillMap.get(node.id);
                const m = masteryMap.get(node.id);
                if (!skill || !m) return null;

                const isSelected = node.id === selectedSkillId;
                const isHighlighted = highlightedPath.includes(node.id);
                const isFiltered = !filteredNodeIds.has(node.id);
                const isDimmed = (highlightedPath.length > 0 && !isHighlighted) || isFiltered;

                const statusColor = STATUS_COLOR[m.status];
                const catColor = CATEGORY_COLOR[skill.category] || 'var(--muted)';

                return (
                  <g 
                    key={node.id} 
                    className="skill-node-group"
                    transform={`translate(${node.x},${node.y - 30})`}
                    style={{ cursor: 'pointer', opacity: isDimmed ? 0.1 : 1, transition: 'all 0.3s' }}
                    onClick={() => {
                      if (isSelected) { selectSkill(null); clearHighlight(); }
                      else { selectSkill(node.id); highlightDependencyPath(node.id); }
                    }}
                  >
                    {/* Node Card */}
                    <rect x="0" y="0" width="160" height="60" rx="12" 
                      fill="var(--card)" 
                      stroke={isSelected ? 'var(--primary)' : 'var(--border)'}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    {/* Category Label */}
                    <rect x="0" y="0" width="4" height="60" rx="4" fill={catColor} />
                    {/* Mastery Dot */}
                    <circle cx="145" cy="15" r="5" fill={statusColor} />
                    {/* Text content */}
                    <text x="12" y="24" fontSize="11" fontWeight="700" fill="var(--text)">
                      {skill.name.length > 18 ? skill.name.slice(0, 16) + '...' : skill.name}
                    </text>
                    <text x="12" y="42" fontSize="9" fill="var(--muted)">
                      {skill.category.replace('_', ' ')} · {skill.estimatedHours}h
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Sidebar Inspector */}
        <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {selectedSkill && selectedMastery ? (
            <div className="card glass-card scale-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.1em' }}>Skill Detail</span>
                <button className="button ghost" style={{ padding: 0 }} onClick={() => { selectSkill(null); clearHighlight(); }}>✕</button>
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>{selectedSkill.name}</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                {selectedSkill.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="mini-meta">
                  <label>Status</label>
                  <div style={{ color: STATUS_COLOR[selectedMastery.status], fontWeight: 700 }}>{selectedMastery.status.replace('_', ' ')}</div>
                </div>
                <div className="mini-meta">
                  <label>Duration</label>
                  <div style={{ fontWeight: 700 }}>{selectedSkill.estimatedHours}h</div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--muted)' }}>Mastery Progress</span>
                  <span style={{ color: 'var(--text)', fontWeight: 700 }}>{selectedMastery.progress}%</span>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div className="progress-bar" style={{ 
                    width: `${selectedMastery.progress}%`, 
                    background: STATUS_COLOR[selectedMastery.status],
                    boxShadow: `0 0 10px ${STATUS_COLOR[selectedMastery.status]}66`
                  }} />
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button className="button" style={{ width: '100%' }} 
                  onClick={() => updateMastery(selectedSkill.id, 'mastered', 100)}>Mark Mastered</button>
                <button className="button secondary" style={{ width: '100%' }}
                  onClick={() => updateMastery(selectedSkill.id, 'in_progress', selectedMastery.progress)}>Active Study</button>
              </div>
            </div>
          ) : (
            <div className="card outline" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗺️</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                Select a skill node to view prerequisites, learning objectives, and projected effort.
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="card outline">
            <div className="section-title">Mastery Overview</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <StatRow label="Critical Path" value={`${graph.dependencies.filter(d => !d.isSoft).length} steps`} />
              <StatRow label="Alternate Paths" value={`${graph.dependencies.filter(d => d.isSoft).length} routes`} />
              <StatRow label="Current Layer" value="Foundation" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{value}</span>
    </div>
  );
}
