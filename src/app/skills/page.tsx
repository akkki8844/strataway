'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSkillStore } from '../../store/skillStore';
import { SkillNode, SkillMasteryState, SkillStatus } from '../../../types/skill';
import { PositionedSkillNode } from '../../../utils/graphLayout';

// ─── Constants & Types ───────────────────────────────────────────────────────

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

const TRANSITION_SMOOTH = 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
const HIGHLIGHT_OPACITY = 1;
const DIMMED_OPACITY = 0.08;

type ViewMode = 'architectural' | 'focus';

interface GraphState {
  mounted: boolean;
  pan: { x: number; y: number };
  zoom: number;
  isDragging: boolean;
  filter: SkillStatus | 'all';
  viewMode: ViewMode;
  autoLayoutActive: boolean;
  hoveredNodeId: string | null;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SkillsPage() {
  const {
    graph, mastery, layout, selectedSkillId, highlightedPath,
    selectSkill, highlightDependencyPath, clearHighlight, updateMastery,
  } = useSkillStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<GraphState>({
    mounted: false,
    pan: { x: window.innerWidth > 1000 ? 300 : 100, y: 300 },
    zoom: 0.85,
    isDragging: false,
    filter: 'all',
    viewMode: 'architectural',
    autoLayoutActive: false,
    hoveredNodeId: null,
  });

  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setState(s => ({ ...s, mounted: true }));
  }, []);

  // ─── Data Maps & Core Logic ───
  
  const masteryMap = useMemo(() => new Map<string, SkillMasteryState>(mastery.map(m => [m.skillId, m])), [mastery]);
  const posMap = useMemo(() => new Map<string, PositionedSkillNode>(layout.nodes.map(n => [n.id, n])), [layout.nodes]);
  const skillMap = useMemo(() => new Map<string, SkillNode>(graph.skills.map(s => [s.id, s])), [graph.skills]);

  const selectedSkill = selectedSkillId ? skillMap.get(selectedSkillId) : null;
  const selectedMastery = selectedSkillId ? masteryMap.get(selectedSkillId) : null;

  // Compute specific node relationships
  const selectedNodeParents = useMemo(() => {
    if (!selectedSkill) return [];
    return graph.dependencies.filter(d => d.toSkillId === selectedSkill.id).map(d => d.fromSkillId);
  }, [selectedSkill, graph.dependencies]);

  const selectedNodeChildren = useMemo(() => {
    if (!selectedSkill) return [];
    return graph.dependencies.filter(d => d.fromSkillId === selectedSkill.id).map(d => d.toSkillId);
  }, [selectedSkill, graph.dependencies]);

  const filteredNodeIds = useMemo(() => new Set(
    layout.nodes
      .filter((n: PositionedSkillNode) => state.filter === 'all' || masteryMap.get(n.id)?.status === state.filter)
      .map((n: PositionedSkillNode) => n.id)
  ), [layout.nodes, state.filter, masteryMap]);

  // ─── Interaction Handlers ───

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest('.skill-node')) return; // Ignore if clicking a node
    setState(s => ({ ...s, isDragging: true }));
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ x: state.pan.x, y: state.pan.y });
  }, [state.pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!state.isDragging) return;
    setState(s => ({ 
      ...s, 
      pan: { 
        x: panStart.x + (e.clientX - dragStart.x), 
        y: panStart.y + (e.clientY - dragStart.y) 
      } 
    }));
  }, [state.isDragging, dragStart, panStart]);

  const handleMouseUp = useCallback(() => setState(s => ({ ...s, isDragging: false })), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!containerRef.current) return;
    
    // Smooth zoom focused on center (standard SVG zoom logic)
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setState(s => ({ ...s, zoom: Math.min(3.0, Math.max(0.15, s.zoom * zoomFactor)) }));
  }, []);

  const triggerAutoCenter = useCallback(() => {
    if (!layout.nodes.length) return;
    
    // Find bounding box of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    layout.nodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    const w = containerRef.current?.clientWidth || window.innerWidth;
    const h = containerRef.current?.clientHeight || window.innerHeight;
    
    const targetZoom = Math.min(w / (maxX - minX + 400), h / (maxY - minY + 400), 1.2);
    const targetPanX = (w / 2) - (((minX + maxX) / 2) * targetZoom);
    const targetPanY = (h / 2) - (((minY + maxY) / 2) * targetZoom);

    // Simulate animated auto-layout
    setState(s => ({ ...s, autoLayoutActive: true, pan: { x: targetPanX, y: targetPanY }, zoom: targetZoom }));
    setTimeout(() => setState(s => ({ ...s, autoLayoutActive: false })), 500);
  }, [layout.nodes]);

  const handleNodeClick = (nodeId: string) => {
    if (selectedSkillId === nodeId) {
      selectSkill(null);
      clearHighlight();
    } else {
      selectSkill(nodeId);
      highlightDependencyPath(nodeId);
    }
  };

  if (!state.mounted) return null;

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)', position: 'relative' }}>
      
      <HeaderControls 
        filter={state.filter} 
        setFilter={(f) => setState(s => ({ ...s, filter: f }))}
        viewMode={state.viewMode}
        setViewMode={(v) => setState(s => ({ ...s, viewMode: v }))}
        triggerCenter={triggerAutoCenter}
        panState={state.pan}
        zoomState={state.zoom}
        setZoom={(z) => setState(s => ({ ...s, zoom: z }))}
      />

      {/* ─── Immersive Graph Canvas ───────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, gap: '2rem', minHeight: 0, marginTop: '1rem' }}>
        
        <div ref={containerRef} style={{ 
          flex: 1, position: 'relative', background: 'var(--bg-soft)', 
          borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden', cursor: state.isDragging ? 'grabbing' : 'grab',
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)'
        }}>
          
          {/* Overlay Grid Background */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none', backgroundSize: `${50 * state.zoom}px ${50 * state.zoom}px`, backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', transform: `translate(${state.pan.x % (50 * state.zoom)}px, ${state.pan.y % (50 * state.zoom)}px)` }} />

          {/* SVG Engine */}
          <svg
            ref={svgRef} width="100%" height="100%"
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ display: 'block', position: 'relative', zIndex: 1 }}
          >
            {/* Defs for advanced styling */}
            <defs>
              <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="var(--border-strong)" />
              </marker>
              <marker id="arrowhead-active" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="var(--primary)" />
              </marker>
            </defs>

            <g style={{ 
              transform: `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`, 
              transition: state.autoLayoutActive ? TRANSITION_SMOOTH : 'none',
              transformOrigin: '0 0'
            }}>
              
              {/* 1. Dependency Edges (Behind Nodes) */}
              {graph.dependencies.map(edge => {
                const from = posMap.get(edge.fromSkillId);
                const to = posMap.get(edge.toSkillId);
                if (!from || !to) return null;

                const isHighlighted = highlightedPath.includes(edge.fromSkillId) && highlightedPath.includes(edge.toSkillId);
                const isHovered = (state.hoveredNodeId === edge.fromSkillId || state.hoveredNodeId === edge.toSkillId) && !selectedSkillId;
                const isDimmed = (highlightedPath.length > 0 && !isHighlighted) || (state.hoveredNodeId && !isHovered && !selectedSkillId);
                
                // Curve logic
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                // Add bezier curve weight based on horizontal distance
                const tension = Math.min(Math.abs(dx) * 0.5, 120);
                
                // Connection points (assuming Node width = 180)
                const startX = from.x + 180;
                const startY = from.y;
                const endX = to.x;
                const endY = to.y;

                const d = `M${startX},${startY} C${startX + tension},${startY} ${endX - tension},${endY} ${endX},${endY}`;

                return (
                  <path
                    key={edge.id}
                    d={d}
                    fill="none"
                    stroke={isHighlighted ? 'var(--primary)' : isHovered ? 'var(--text-soft)' : 'var(--border-strong)'}
                    strokeWidth={isHighlighted ? 3 : isHovered ? 2 : 1.5}
                    strokeDasharray={edge.isSoft ? '6,4' : '0'}
                    opacity={isDimmed ? 0.05 : isHighlighted ? 1 : 0.6}
                    markerEnd={isHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                    style={{ transition: TRANSITION_SMOOTH }}
                  />
                );
              })}

              {/* 2. Topographical Node Layer */}
              {layout.nodes.map((node: PositionedSkillNode) => {
                const skill = skillMap.get(node.id);
                const m = masteryMap.get(node.id);
                if (!skill || !m) return null;

                const isSelected = node.id === selectedSkillId;
                const isHighlighted = highlightedPath.includes(node.id);
                const isFilteredOut = !filteredNodeIds.has(node.id);
                const isHovered = state.hoveredNodeId === node.id;
                
                // State booleans for visual representation
                const isFocusedMode = state.viewMode === 'focus' && selectedSkillId;
                let opacity = 1;

                if (isFilteredOut) {
                  opacity = DIMMED_OPACITY;
                } else if (isFocusedMode) {
                  opacity = isHighlighted ? HIGHLIGHT_OPACITY : DIMMED_OPACITY;
                } else if (highlightedPath.length > 0) {
                  opacity = isHighlighted ? HIGHLIGHT_OPACITY : DIMMED_OPACITY * 2;
                } else if (state.hoveredNodeId && !isHovered) {
                  // Direct child/parent of hovered node?
                  const isRelative = graph.dependencies.find(d => 
                    (d.fromSkillId === state.hoveredNodeId && d.toSkillId === node.id) ||
                    (d.toSkillId === state.hoveredNodeId && d.fromSkillId === node.id)
                  );
                  opacity = isRelative ? HIGHLIGHT_OPACITY : DIMMED_OPACITY;
                }

                const statusColor = STATUS_COLOR[m.status];
                const catColor = CATEGORY_COLOR[skill.category] || 'var(--muted)';
                const isLocked = m.status === 'locked';

                return (
                  <g 
                    key={node.id} 
                    className="skill-node"
                    transform={`translate(${node.x},${node.y - 30})`}
                    style={{ cursor: 'pointer', opacity, transition: TRANSITION_SMOOTH }}
                    onClick={(e) => { e.stopPropagation(); handleNodeClick(node.id); }}
                    onMouseEnter={() => setState(s => ({ ...s, hoveredNodeId: node.id }))}
                    onMouseLeave={() => setState(s => ({ ...s, hoveredNodeId: null }))}
                  >
                    {/* Shadow Plate */}
                    {(isSelected || isHovered) && (
                      <rect x="-4" y="-4" width="188" height="68" rx="14" fill={isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.1)'} opacity={isSelected ? 0.2 : 1} filter={isSelected ? "url(#neon-glow)" : ""} />
                    )}

                    {/* Main Card Body */}
                    <rect x="0" y="0" width="180" height="60" rx="10" 
                      fill={isLocked ? 'rgba(0,0,0,0.6)' : 'var(--card)'} 
                      stroke={isSelected ? 'var(--primary)' : isHovered ? 'var(--text-soft)' : 'var(--border)'}
                      strokeWidth={isSelected ? 2 : 1}
                      style={{ transition: TRANSITION_SMOOTH }}
                    />
                    
                    {/* Lock Icon Overlay for Locked Nodes */}
                    {isLocked && (
                      <g transform="translate(160, 22)" opacity={0.3}>
                         <rect x="0" y="6" width="10" height="8" rx="2" fill="#fff" />
                         <path d="M2 6V4a3 3 0 0 1 6 0v2" fill="none" stroke="#fff" strokeWidth="1.5" />
                      </g>
                    )}

                    {/* Left Category Indicator */}
                    <rect x="0" y="0" width="4" height="60" rx="4" fill={catColor} />
                    
                    {/* Mastery Status Ring */}
                    <circle cx="155" cy="15" r="5" fill={statusColor} />
                    {isSelected && <circle cx="155" cy="15" r="9" fill="none" stroke={statusColor} strokeWidth="1.5" strokeDasharray="3 2" style={{ animation: 'spin 4s linear infinite', transformOrigin: '155px 15px' }} />}
                    
                    {/* Top Text Content */}
                    <text x="14" y="24" fontSize="12" fontWeight="700" fill={isLocked ? 'var(--muted)' : 'var(--text)'}>
                      {skill.name.length > 20 ? skill.name.slice(0, 18) + '...' : skill.name}
                    </text>
                    
                    {/* Bottom Metadata */}
                    <text x="14" y="44" fontSize="9" fill="var(--muted)" fontWeight={600} letterSpacing="0.05em" textTransform="uppercase">
                      {skill.category.replace('_', ' ')}
                    </text>
                    
                    <text x="14" y="54" fontSize="8" fill="var(--muted-soft)">
                      {skill.estimatedHours}h Load • {m.progress}% Verified
                    </text>

                    {/* Inner Progress Bar */}
                    <rect x="14" y="32" width="150" height="2" rx="1" fill="rgba(255,255,255,0.05)" />
                    {m.progress > 0 && (
                       <rect x="14" y="32" width={150 * (m.progress / 100)} height="2" rx="1" fill={statusColor} />
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Graph Legend Overlay */}
          <GraphLegend />
        </div>

        {/* ─── Right Sidebar: Node Inspector ───────────────────────────── */}
        <div style={{ width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {selectedSkill && selectedMastery ? (
            <SkillInspector 
              skill={selectedSkill} 
              mastery={selectedMastery}
              parents={selectedNodeParents}
              children={selectedNodeChildren}
              skillMap={skillMap}
              masteryMap={masteryMap}
              onSelect={handleNodeClick}
              onUpdate={updateMastery}
            />
          ) : (
            <div className="card outline" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3rem 2rem', background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', opacity: 0.8, filter: 'drop-shadow(0 0 20px rgba(79, 140, 255, 0.2))' }}>💠</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>Topography Inspector</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.75rem', lineHeight: 1.6 }}>
                Select any computational node on the graph canvas to inspect its architecture. 
                You can review prerequisites, execute manual overrides on mastery states, and trace critical dependency paths.
              </p>
            </div>
          )}

          {/* Global Graph Telemetry */}
          <section className="card outline glass-panel" style={{ padding: '1.25rem' }}>
            <div className="section-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TerminalIcon /> Global Graph Telemetry
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <TelemetryStat label="Total Nodes" value={graph.skills.length} />
              <TelemetryStat label="Data Links" value={graph.dependencies.length} />
              <TelemetryStat label="Engine Yield" value={`${Math.round((mastery.filter(m => m.status === 'mastered').length / graph.skills.length) * 100)}%`} color="var(--success)" />
              <TelemetryStat label="Active State" value={mastery.filter(m => m.status === 'in_progress').length} color="var(--primary)" />
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.7rem', color: 'var(--muted)' }}>
              Topological Engine v2.4.1 — Constraints Active
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function HeaderControls({ filter, setFilter, viewMode, setViewMode, triggerCenter, zoomState, setZoom }: any) {
  return (
    <div className="page-header page-header-row" style={{ flexShrink: 0, paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
      <div>
        <h1 className="page-title text-gradient" style={{ fontSize: '2rem', letterSpacing: '-0.03em' }}>Knowledge Architecture</h1>
        <p className="page-subtitle" style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>
          Explore the prerequisite graph. Topographical analysis mode active.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        
        {/* State Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-elevated)', padding: '0.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, paddingLeft: '0.5rem', marginRight: '0.2rem' }}>Filter Matrix:</span>
          {(['all', 'mastered', 'in_progress', 'available', 'locked'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                fontSize: '0.7rem', fontWeight: 600, border: 'none',
                padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                background: filter === f ? 'var(--primary-soft)' : 'transparent',
                color: filter === f ? 'var(--primary)' : 'var(--muted)',
                transition: TRANSITION_SMOOTH
              }}>
              {f === 'all' ? 'All Data' : f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* View Mode */}
        <div style={{ display: 'flex', gap: '0.2rem', background: 'var(--bg-elevated)', padding: '0.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <button 
            style={{ fontSize: '0.7rem', fontWeight: 600, border: 'none', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: viewMode === 'architectural' ? 'var(--primary-soft)' : 'transparent', color: viewMode === 'architectural' ? 'var(--primary)' : 'var(--muted)' }}
            onClick={() => setViewMode('architectural')}
          >
            Architectural
          </button>
          <button 
           style={{ fontSize: '0.7rem', fontWeight: 600, border: 'none', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: viewMode === 'focus' ? 'var(--primary-soft)' : 'transparent', color: viewMode === 'focus' ? 'var(--primary)' : 'var(--muted)' }}
            onClick={() => setViewMode('focus')}
          >
            Focal Trace
          </button>
        </div>

        {/* Zoom Controls */}
        <div style={{ display: 'flex', gap: '0.3rem', marginLeft: '0.5rem' }}>
          <button className="button secondary icon-btn" onClick={() => setZoom(Math.min(3.0, zoomState * 1.2))} title="Zoom In">+</button>
          <button className="button secondary icon-btn" onClick={() => setZoom(Math.max(0.15, zoomState / 1.2))} title="Zoom Out">−</button>
          <button className="button secondary icon-btn" onClick={triggerCenter} title="Auto-center Topology"><FocusIcon /></button>
        </div>
      </div>
    </div>
  );
}

function GraphLegend() {
  return (
    <div className="glass-card scale-in" style={{ 
      position: 'absolute', bottom: '1.5rem', left: '1.5rem', 
      padding: '1.25rem', borderRadius: 'var(--radius-lg)', zIndex: 10,
      width: '200px', border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div className="section-title" style={{ fontSize: '0.75rem', marginBottom: '1rem', color: 'var(--text)' }}>Topographical Guide</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {Object.entries(STATUS_COLOR).map(([s, c]) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: c, boxShadow: s === 'in_progress' ? `0 0 8px ${c}` : 'none' }} />
            <span style={{ textTransform: 'capitalize', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>{s.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
      <div style={{ margin: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="var(--border-strong)" strokeWidth="2" strokeDasharray="3 3"/></svg>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Soft Dependency</span>
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="var(--border-strong)" strokeWidth="2" /></svg>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Hard Prerequisite</span>
         </div>
      </div>
    </div>
  );
}

function SkillInspector({ skill, mastery, parents, children, skillMap, masteryMap, onSelect, onUpdate }: any) {
  const isMastered = mastery.status === 'mastered';
  const isLocked = mastery.status === 'locked';

  return (
    <div className="card glass-card slide-down" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Background Decorator */}
      <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: '50%', background: STATUS_COLOR[mastery.status], opacity: 0.1, filter: 'blur(40px)', zIndex: 0 }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLOR[mastery.status], boxShadow: `0 0 10px ${STATUS_COLOR[mastery.status]}` }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>Node Inspector</span>
          </div>
          <button className="button ghost small" onClick={() => onSelect(skill.id)}>✕ Close</button>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text)', lineHeight: 1.2 }}>{skill.name}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
           <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
             {skill.category.replace('_', ' ')}
           </span>
           <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', textTransform: 'uppercase' }}>
             {skill.estimatedHours}h Load
           </span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
          {skill.description}
        </p>

        {/* Trace Analysis */}
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem' }}>Critical Prerequisites ({parents.length})</div>
            {parents.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-soft)', fontStyle: 'italic' }}>Foundational layer (Root Node).</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {parents.map((pId: string) => {
                  const pSkill = skillMap.get(pId);
                  const pMast = masteryMap.get(pId);
                  if (!pSkill || !pMast) return null;
                  return (
                    <div key={pId} onClick={() => onSelect(pId)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', transition: HOVER_TRANSITION }} className="hoverable">
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[pMast.status] }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{pSkill.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem' }}>Unlocks Pathways ({children.length})</div>
            {children.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-soft)', fontStyle: 'italic' }}>Terminal layer (Endpoint Node).</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {children.slice(0, 3).map((cId: string) => {
                  const cSkill = skillMap.get(cId);
                  const cMast = masteryMap.get(cId);
                  if (!cSkill || !cMast) return null;
                  return (
                    <div key={cId} onClick={() => onSelect(cId)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'var(--bg-elevated)', border: '1px dsahed var(--border)', borderRadius: '4px', cursor: 'pointer', transition: HOVER_TRANSITION }} className="hoverable">
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[cMast.status] }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{cSkill.name}</span>
                    </div>
                  );
                })}
                {children.length > 3 && <div style={{ fontSize: '0.7rem', color: 'var(--muted-soft)' }}>+ {children.length - 3} additional paths...</div>}
              </div>
            )}
          </div>

        </div>
      </div>

      <div style={{ marginTop: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>
          <span style={{ color: 'var(--text)' }}>Mastery Protocol</span>
          <span style={{ color: STATUS_COLOR[mastery.status] }}>{mastery.progress}% Verified</span>
        </div>
        <div className="progress" style={{ height: '8px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)' }}>
          <div className="progress-bar" style={{ 
            width: `${mastery.progress}%`, 
            background: STATUS_COLOR[mastery.status],
            boxShadow: `0 0 10px ${STATUS_COLOR[mastery.status]}66`
          }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
          {isLocked ? (
             <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--danger)', textAlign: 'center', lineHeight: 1.4 }}>
               Node locked. Required prerequisite topologies must be verified first.
             </div>
          ) : isMastered ? (
            <button className="button" style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--muted)' }} 
                 onClick={() => onUpdate(skill.id, 'in_progress', 50)}>Revoke Verified Status</button>
          ) : (
            <>
              <button className="button primary-gradient" style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }} 
                onClick={() => onUpdate(skill.id, 'mastered', 100)}>Force Mastery Verification</button>
              <button className="button secondary" style={{ width: '100%' }}
                onClick={() => onUpdate(skill.id, 'in_progress', Math.min(mastery.progress + 25, 90))}>Iterate Protocol (+25%)</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TelemetryStat({ label, value, color }: { label: string; value: string | number, color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: color || 'var(--text)' }}>{value}</div>
    </div>
  );
}

// ─── Icons ───
function FocusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M3 12h3m12 0h3m-9-9v3m0 12v3"/></svg>;
}
function TerminalIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>;
}
