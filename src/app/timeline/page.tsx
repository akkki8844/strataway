'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { useRouteStore } from '../../store/routeStore';
import { Task } from '../../../types/task';
import Link from 'next/link';

// ─── Types & Constants ───────────────────────────────────────────────────────

type TimelineViewMode = 'focused' | 'density' | 'list';

interface TimelinePageState {
  mounted: boolean;
  focusedWeek: number;
  viewMode: TimelineViewMode;
  selectedTask: Task | null;
  showCapacityPanel: boolean;
  rescheduleTarget: number | null;
  draggedTaskInfo: { taskId: string; sourceWeek: number } | null;
  dragOverWeek: number | null;
}

const TRANSITION_SPRING = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
const HOVER_TRANSITION = 'all 0.2s ease';

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TimelinePage() {
  const { 
    tasks, currentWeek, maxHoursPerWeek, 
    completeTask, skipTask, rescheduleTask, adaptToCapacityChange, autoOptimize, undoLastAction,
    getWeekLoad, getHistoryLogs, optimizationOpportunities, lastResultMetrics
  } = useTimelineStore();
  
  const { routes, activeRouteId } = useRouteStore();
  
  const [state, setState] = useState<TimelinePageState>({
    mounted: false,
    focusedWeek: currentWeek,
    viewMode: 'focused',
    selectedTask: null,
    showCapacityPanel: false,
    rescheduleTarget: null,
    draggedTaskInfo: null,
    dragOverWeek: null,
  });

  useEffect(() => { setState(s => ({ ...s, mounted: true })); }, []);

  // ─── Derived Data ───
  const activeRoute = useMemo(() => routes.find(r => r.meta.id === activeRouteId), [routes, activeRouteId]);
  const totalWeeks = activeRoute?.weeks ?? 36;
  const visibleWeeks = useMemo(() => Array.from({ length: totalWeeks }, (_, i) => i), [totalWeeks]);
  
  const completedCount = useMemo(() => tasks.filter(t => t.execution.status === 'completed').length, [tasks]);
  const completionPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const activeFocusTasks = useMemo(() => tasks.filter(t => t.core.weekIndex === state.focusedWeek), [tasks, state.focusedWeek]);
  const actionHistory = getHistoryLogs();

  const getWeekStatus = (w: number) => {
    const load = getWeekLoad(w);
    const pct = load / maxHoursPerWeek;
    if (pct > 1.1) return 'overload';
    if (pct > 0.85) return 'heavy';
    if (pct > 0.4) return 'moderate';
    if (pct > 0.1) return 'light';
    return 'empty';
  };

  // ─── Handlers ───
  const selectTask = (task: Task | null) => setState(s => ({ ...s, selectedTask: task }));
  
  const handleDragStart = (e: React.DragEvent, taskId: string, sourceWeek: number) => {
    e.dataTransfer.setData('taskId', taskId);
    setState(s => ({ ...s, draggedTaskInfo: { taskId, sourceWeek } }));
  };

  const handleDragOver = (e: React.DragEvent, week: number) => {
    e.preventDefault();
    if (state.dragOverWeek !== week) setState(s => ({ ...s, dragOverWeek: week }));
  };

  const handleDrop = (e: React.DragEvent, targetWeek: number) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    setState(s => ({ ...s, draggedTaskInfo: null, dragOverWeek: null }));
    
    if (taskId && state.draggedTaskInfo?.sourceWeek !== targetWeek) {
      const result = rescheduleTask(taskId, targetWeek);
      if (!result.success) {
        alert(result.messages.join('\n')); // Fallback for prototype; real UI would use tost
      }
    }
  };

  if (!state.mounted) return null;

  return (
    <div className="slide-up">
      <TimelineHeader 
        activeRoute={activeRoute} 
        tasks={tasks} 
        totalWeeks={totalWeeks} 
        completionPct={completionPct}
        onToggleCapacity={() => setState(s => ({ ...s, showCapacityPanel: !s.showCapacityPanel }))}
      />

      {state.showCapacityPanel && (
        <CapacityControlPanel 
          currentMax={maxHoursPerWeek} 
          onApply={(newMax) => { adaptToCapacityChange(newMax); setState(s => ({ ...s, showCapacityPanel: false })); }}
          onClose={() => setState(s => ({ ...s, showCapacityPanel: false }))}
        />
      )}

      {/* Engine Metrics Bar */}
      {lastResultMetrics && (
        <div className="card glass-card scale-in" style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', background: 'rgba(79, 140, 255, 0.05)', border: '1px solid rgba(79, 140, 255, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>Engine Output:</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: '0.5rem' }}>
              Shifted {lastResultMetrics.tasksAffected} nodes across {lastResultMetrics.totalWeeksShifted} weeks. Capacity efficiency is {lastResultMetrics.capacityEfficiency}%.
            </span>
          </div>
          {lastResultMetrics.loadViolationCount > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              Requires Manual Override: {lastResultMetrics.loadViolationCount} Structural Breaches
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem' }}>
        
        {/* ─── Left Canvas: Timeline ──────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Timeline Heatmap */}
          <section className="card outline">
            <div className="section-header">
              <div>
                <div className="section-title">Execution Topography</div>
                <div className="section-subtitle">T-{state.focusedWeek}: Computational load mapped across {totalWeeks} blocks. Drag rows to reschedule.</div>
              </div>
              <div style={{ display: 'flex', gap: '0.2rem', background: 'var(--bg-elevated)', padding: '0.2rem', borderRadius: 'var(--radius-md)' }}>
                {(['focused', 'density'] as const).map(mode => (
                  <button 
                    key={mode} onClick={() => setState(s => ({ ...s, viewMode: mode }))}
                    className="button"
                    style={{ background: state.viewMode === mode ? 'var(--primary-soft)' : 'transparent', color: state.viewMode === mode ? 'var(--primary)' : 'var(--muted)', fontSize: '0.75rem', padding: '0.4rem 0.6rem', border: 'none' }}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '1rem' }}>
              {visibleWeeks.map(w => {
                const s = getWeekStatus(w);
                const isCurrent = w === currentWeek;
                const isFocused = w === state.focusedWeek;
                const isDragOver = w === state.dragOverWeek;
                
                let color = 'rgba(255,255,255,0.05)';
                if (s === 'overload') color = 'var(--danger)';
                else if (s === 'heavy') color = 'var(--warning)';
                else if (s === 'moderate') color = 'var(--primary)';
                else if (s === 'light') color = 'var(--primary-glow)';

                return (
                  <div
                    key={w}
                    onClick={() => setState(state => ({ ...state, focusedWeek: w }))}
                    onDragOver={(e) => handleDragOver(e, w)}
                    onDrop={(e) => handleDrop(e, w)}
                    title={`Week ${w}: ${getWeekLoad(w).toFixed(1)}h / ${maxHoursPerWeek}h`}
                    className="heatmap-cell hoverable scale-in"
                    style={{
                      flex: '1 0 calc(100% / 18 - 6px)',
                      height: state.viewMode === 'focused' ? '40px' : '24px',
                      borderRadius: 'var(--radius-sm)',
                      background: color,
                      border: isDragOver ? '2px dashed var(--primary)' : isFocused ? '2px solid #fff' : isCurrent ? '2px solid var(--primary)' : '1px solid transparent',
                      opacity: w < currentWeek ? 0.4 : 1,
                      position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: TRANSITION_SPRING,
                      cursor: 'pointer'
                    }}
                  >
                    {state.viewMode === 'focused' && (
                       <span style={{ fontSize: '0.65rem', fontWeight: isFocused ? 700 : 500, color: isFocused ? '#000' : '#fff' }}>
                         {w}
                       </span>
                    )}
                    {isCurrent && <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--primary)' }}/>}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Active Block Inspector */}
          <section className="card outline">
             <div className="section-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Block {state.focusedWeek} <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '1rem' }}>| Detail View</span></h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ background: 'var(--bg-elevated)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    <span style={{ color: 'var(--text)' }}>{getWeekLoad(state.focusedWeek).toFixed(1)}h</span> / {maxHoursPerWeek}h
                  </div>
                  <span style={{ color: state.focusedWeek < currentWeek ? 'var(--success)' : state.focusedWeek === currentWeek ? 'var(--primary)' : 'var(--muted)' }}>
                    {state.focusedWeek < currentWeek ? 'Verified History' : state.focusedWeek === currentWeek ? 'Active Operation' : 'Forward Projection'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="button secondary" onClick={() => setState(s => ({ ...s, focusedWeek: Math.max(0, s.focusedWeek - 1) }))}>← Prev</button>
                <button className="button secondary" onClick={() => setState(s => ({ ...s, focusedWeek: Math.min(totalWeeks - 1, s.focusedWeek + 1) }))}>Next →</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {activeFocusTasks.length === 0 ? (
                <div className="empty-state" style={{ padding: '4rem 1rem', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }}>🛰️</div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>Void Space</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>No computational payload assigned to this block.</div>
                </div>
              ) : (
                activeFocusTasks.map(task => (
                  <DraggableTaskRow 
                    key={task.core.id} 
                    task={task} 
                    isSelected={state.selectedTask?.core.id === task.core.id}
                    onSelect={() => selectTask(state.selectedTask?.core.id === task.core.id ? null : task)}
                    onDragStart={(e) => handleDragStart(e, task.core.id, state.focusedWeek)}
                  />
                ))
              )}
            </div>
          </section>

        </div>

        {/* ─── Right Canvas: Conflict & Telemetry ──────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Tactical Inspector */}
          {state.selectedTask ? (
            <TaskTacticalInspector 
              task={state.selectedTask} 
              currentWeek={currentWeek} 
              totalWeeks={totalWeeks}
              onClose={() => selectTask(null)}
              onComplete={(id, val) => { completeTask(id, val); selectTask(null); }}
              onSkip={(id) => { skipTask(id, 'manual_skip'); selectTask(null); }}
              onReschedule={(id, target) => {
                const res = rescheduleTask(id, target);
                if (res.success) selectTask(null);
                else alert(res.messages.join('\n'));
              }}
            />
          ) : (
            <OptimizationPanel ops={optimizationOpportunities} triggerOptimize={autoOptimize} />
          )}

          {/* Action Buffer (Undo History) */}
          <section className="card outline">
            <div className="section-header" style={{ marginBottom: '1rem' }}>
              <div className="section-title" style={{ fontSize: '1rem' }}>Engine History Buffer</div>
              {actionHistory.length > 0 && (
                <button className="button ghost small" onClick={undoLastAction} title="Revert last global action">
                  ↩ Undo
                </button>
              )}
            </div>
            
            {actionHistory.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--muted-soft)', padding: '1rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
                Buffer clear. No recent timeline mutations.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {actionHistory.map((act, i) => (
                  <div key={act.id} style={{ display: 'flex', gap: '0.75rem', opacity: i === 0 ? 1 : 0.6 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? 'var(--primary)' : 'var(--border)' }} />
                      {i < actionHistory.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 4 }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{act.type.replace('_', ' ')}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>{act.description}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--muted-soft)', marginTop: '0.5rem' }}>{new Date(act.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function TimelineHeader({ activeRoute, tasks, totalWeeks, completionPct, onToggleCapacity }: any) {
  return (
    <div className="page-header page-header-row" style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
      <div>
        <h1 className="page-title text-gradient" style={{ fontSize: '2rem', letterSpacing: '-0.03em' }}>Tactical Planner</h1>
        <p className="page-subtitle" style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 600, background: 'rgba(79, 140, 255, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', marginRight: '0.5rem' }}>
            {activeRoute?.meta.label ?? 'Custom Trajectory'}
          </span>
          <span style={{ color: 'var(--muted)' }}>
            System tracking {tasks.length} computational payloads across {totalWeeks} blocks.
          </span>
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', marginRight: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Global Integrity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '60px', height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${completionPct}%`, height: '100%', background: 'var(--success)' }} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>{completionPct}%</span>
          </div>
        </div>
        <button className="button secondary" onClick={onToggleCapacity} style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <SettingsIcon /> Capacity Engine
        </button>
      </div>
    </div>
  );
}

function CapacityControlPanel({ currentMax, onApply, onClose }: { currentMax: number, onApply: (val: number) => void, onClose: () => void }) {
  const [val, setVal] = useState(currentMax);
  
  return (
    <div className="card glass-card slide-down" style={{ marginBottom: '2rem', border: '1px solid rgba(192, 132, 252, 0.3)', background: 'linear-gradient(135deg, rgba(29,29,31,0.9) 0%, rgba(192,132,252,0.05) 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 className="section-title" style={{ fontSize: '1.25rem' }}>Constraint Engine: Capacity Limit</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.25rem', maxWidth: '600px', lineHeight: 1.5 }}>
            Modifying the global temporal threshold will trigger a recursive bin-packing algorithm. 
            The system will repack all future payloads to ensure no block exceeds this threshold, 
            while strictly maintaining prerequisite topological order.
          </p>
        </div>
        <button className="button ghost" onClick={onClose}>✕</button>
      </div>
      
      <div style={{ background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-soft)' }}>Weekly Hour Ceiling</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{val}<span style={{ fontSize: '1rem', color: 'var(--muted)', fontWeight: 500 }}>h / wk</span></span>
        </div>
        
        <input 
          type="range" min={5} max={40} value={val} step={1}
          onChange={e => setVal(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#c084fc', cursor: 'pointer' }}
        />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted-soft)' }}>
          <span>5h (Extremely Restricted)</span>
          <span>20h (Standard Load)</span>
          <span>40h (Total Immersion)</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <button className="button secondary" onClick={onClose}>Cancel Override</button>
          <button className="button primary-gradient" onClick={() => onApply(val)}>Execute Repack Algorithm</button>
        </div>
      </div>
    </div>
  );
}

function DraggableTaskRow({ task, isSelected, onSelect, onDragStart }: any) {
  const isDone = task.execution.status === 'completed';
  const isSkipped = task.execution.status === 'skipped';
  
  return (
    <div 
      draggable={!isDone && !isSkipped}
      onDragStart={onDragStart}
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem',
        background: isSelected ? 'rgba(79, 140, 255, 0.06)' : 'var(--bg-elevated)',
        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)', cursor: isDone ? 'default' : 'grab',
        opacity: isDone || isSkipped ? 0.5 : 1, transition: HOVER_TRANSITION,
        boxShadow: isSelected ? '0 4px 20px rgba(0,0,0,0.2)' : 'none'
      }}
      className={!isDone && !isSkipped ? 'hoverable' : ''}
    >
      <div style={{ width: 12, display: 'flex', justifyContent: 'center', color: 'var(--muted-soft)', cursor: 'grab' }}>
        {!isDone && !isSkipped && '⋮⋮'}
      </div>
      
      <div className={`task-dot ${task.core.kind}`} style={{ width: 12, height: 12, flexShrink: 0 }} />
      
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', textDecoration: isDone ? 'line-through' : 'none' }}>
           {task.core.title}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', gap: '0.75rem', marginTop: '0.3rem' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{task.core.kind.replace('_', ' ')}</span>
          <span>|</span>
          <span style={{ color: 'var(--primary-soft)' }}>Node ⟨{task.links.skillId?.replace(/_/g, ' ') ?? 'None'}⟩</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{task.core.estimatedHours}h</div>
        <StatusBadge status={task.execution.status} />
      </div>
    </div>
  );
}

function TaskTacticalInspector({ task, currentWeek, totalWeeks, onClose, onComplete, onSkip, onReschedule }: any) {
  const [target, setTarget] = useState<number | ''>('');
  
  return (
    <div className="card glass slide-down" style={{ borderTop: '4px solid var(--primary)', position: 'sticky', top: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="pulse-dot" style={{ background: 'var(--primary)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inspector Target Acquired</span>
        </div>
        <button className="button ghost small" onClick={onClose}>✕</button>
      </div>

      <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem', lineHeight: 1.3 }}>
        {task.core.title}
      </h4>
      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
        {task.core.description}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <DataPoint label="Payload Cost" value={`${task.core.estimatedHours} Hours`} />
        <DataPoint label="Network Node" value={task.links.skillId?.replace(/_/g, ' ') ?? 'Root System'} />
        <DataPoint label="Classification" value={task.core.kind.replace('_', ' ')} />
        <DataPoint label="Current Status" value={task.execution.status} />
        {task.adjustment?.skipReason && (
          <DataPoint label="System Override" value={task.adjustment.skipReason.replace('_', ' ')} color="var(--warning)" />
        )}
      </div>

      {task.execution.status === 'planned' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
           <button className="button primary-gradient" onClick={() => onComplete(task.core.id, task.core.estimatedHours)} style={{ width: '100%', padding: '0.75rem' }}>
             Verify & Commit Execution
           </button>
           <button className="button secondary" onClick={() => onSkip(task.core.id)} style={{ width: '100%' }}>
             Override: Bypass Payload
           </button>
        </div>
      )}

      {task.execution.status !== 'completed' && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600, marginBottom: '1rem' }}>Manual Shift Operator</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="number" 
              className="input" 
              style={{ flex: 1, padding: '0.6rem', textAlign: 'center' }}
              min={0} max={totalWeeks}
              placeholder="Target Block (e.g. 5)"
              value={target}
              onChange={e => setTarget(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <button className="button" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} onClick={() => {
              if (target !== '' && target >= 0) onReschedule(task.core.id, target);
            }}>
              Execute Shift
            </button>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted-soft)', marginTop: '0.5rem', textAlign: 'center' }}>
            Warning: Shifting backwards may violate topological constraints causing engine fault.
          </div>
        </div>
      )}
    </div>
  );
}

function OptimizationPanel({ ops, triggerOptimize }: { ops: Task[], triggerOptimize: () => void }) {
  if (ops.length === 0) {
    return (
      <div className="card outline" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✓</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Optimal Topography</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>The engine detects no theoretical advantages to advancing payloads.</div>
      </div>
    );
  }

  return (
    <div className="card outline scale-in" style={{ borderLeft: '4px solid var(--success)', background: 'linear-gradient(90deg, rgba(34,197,94,0.05) 0%, transparent 100%)' }}>
      <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
        <ZapIcon /> Engine Optimization Available
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5, marginTop: '0.5rem', marginBottom: '1rem' }}>
        The system has identified {ops.length} payload(s) that can be pulled forward into unutilized capacity blocks without violating prerequisite structure.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', maxHeight: '120px', overflowY: 'auto' }}>
        {ops.slice(0, 3).map(o => (
          <div key={o.core.id} style={{ fontSize: '0.75rem', color: 'var(--text-soft)', padding: '0.4rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
            <span style={{ color: 'var(--success)' }}>⇧ Pull forward:</span> {o.core.title}
          </div>
        ))}
        {ops.length > 3 && <div style={{ fontSize: '0.7rem', color: 'var(--muted)', padding: '0.4rem' }}>+ {ops.length - 3} more payloads...</div>}
      </div>

      <button className="button" style={{ background: 'var(--success)', color: '#000', fontWeight: 700, width: '100%' }} onClick={triggerOptimize}>
        Execute Optimization Protocol
      </button>
    </div>
  );
}

// ─── Helpers ───

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { c: string; bg: string }> = {
    completed: { c: 'var(--success)', bg: 'rgba(34,197,94,0.15)' },
    in_progress: { c: 'var(--primary)', bg: 'rgba(79,140,255,0.15)' },
    planned: { c: 'var(--muted)', bg: 'rgba(255,255,255,0.06)' },
    skipped: { c: 'var(--danger)', bg: 'rgba(239,68,68,0.15)' },
  };
  const s = map[status] ?? map.planned;
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: s.c, background: s.bg, padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {status}
    </span>
  );
}

function DataPoint({ label, value, color }: { label: string; value: string, color?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: color || 'var(--text)', textTransform: 'capitalize' }}>{value}</div>
    </div>
  );
}

function SettingsIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function ZapIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
}
