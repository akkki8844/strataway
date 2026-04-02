'use client';

import React, { useState, useEffect } from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { useRouteStore } from '../../store/routeStore';
import { Task } from '../../../types/task';
import Link from 'next/link';

export default function TimelinePage() {
  const { 
    tasks, currentWeek, maxHoursPerWeek, completeTask, skipTask, 
    rescheduleTask, adaptToCapacityChange, getWeekLoad 
  } = useTimelineStore();
  const { routes, activeRouteId } = useRouteStore();
  
  const [mounted, setMounted] = useState(false);
  const [focusedWeek, setFocusedWeek] = useState(currentWeek);
  const [newMaxHours, setNewMaxHours] = useState(maxHoursPerWeek);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCapacityPanel, setShowCapacityPanel] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const activeRoute = routes.find(r => r.meta.id === activeRouteId);
  const totalWeeks = activeRoute?.weeks ?? 36;
  const visibleWeeks = Array.from({ length: totalWeeks }, (_, i) => i);

  const getTasksForWeek = (w: number) => tasks.filter(t => t.core.weekIndex === w);
  const getWeekStatus = (w: number) => {
    const load = getWeekLoad(w);
    const pct = load / maxHoursPerWeek;
    if (pct > 1.1) return 'overload';
    if (pct > 0.85) return 'heavy';
    if (pct > 0.4) return 'moderate';
    if (pct > 0.1) return 'light';
    return 'empty';
  };

  const completedCount = tasks.filter(t => t.execution.status === 'completed').length;
  const completionPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (!mounted) return null;

  return (
    <div className="slide-up">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title text-gradient">Timeline Planner</h1>
          <p className="page-subtitle">
            {activeRoute?.meta.label} · {tasks.length} tasks across {totalWeeks} weeks · 
            <span style={{ color: 'var(--success)', fontWeight: 600, marginLeft: '0.5rem' }}>{completionPct}% complete</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="button secondary" onClick={() => setShowCapacityPanel(!showCapacityPanel)}>
            ⚙ Adapt Capacity
          </button>
        </div>
      </div>

      {/* ── Capacity Adjustment ────────────────────────────────────────── */}
      {showCapacityPanel && (
        <div className="card glass-card scale-in" style={{ marginBottom: '2rem' }}>
          <div className="section-title">Adapt Timeline Capacity</div>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
            Adjusting your weekly capacity will trigger an <strong style={{ color: 'var(--text)' }}>adaptive re-routing</strong>. 
            All unplanned and skipped tasks will be rescheduled to fit within the new limit while maintaining dependency order.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>New Limit</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{newMaxHours}h/week</span>
              </div>
              <input 
                type="range" min={3} max={30} value={newMaxHours}
                onChange={e => setNewMaxHours(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }} 
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="button" onClick={() => { adaptToCapacityChange(newMaxHours); setShowCapacityPanel(false); }}>
                Apply Changes
              </button>
              <button className="button ghost" onClick={() => setShowCapacityPanel(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
        {/* ── Left: Main Timeline ───────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Week Selector Grid */}
          <div className="card outline">
            <div className="section-header">
              <div className="section-title" style={{ color: 'var(--text)' }}>Timeline Navigator</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Current: Wk {currentWeek + 1}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '6px' }}>
              {visibleWeeks.map(w => {
                const s = getWeekStatus(w);
                const isCurrent = w === currentWeek;
                const isFocused = w === focusedWeek;
                const color = s === 'overload' ? 'var(--danger)' 
                  : s === 'heavy' ? 'var(--warning)' 
                  : s === 'moderate' ? 'var(--primary)' 
                  : s === 'light' ? 'var(--primary-glow)' 
                  : 'rgba(255,255,255,0.05)';
                
                return (
                  <div
                    key={w}
                    onClick={() => setFocusedWeek(w)}
                    title={`Week ${w + 1}: ${getWeekLoad(w).toFixed(1)}h`}
                    className="heatmap-cell"
                    style={{
                      height: '32px',
                      borderRadius: 'var(--radius-xs)',
                      background: color,
                      border: isFocused ? '2px solid #fff' : isCurrent ? '2px solid var(--primary)' : 'none',
                      opacity: w < currentWeek ? 0.4 : 1
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Focused Week View */}
          <div className="card glass">
            <div className="section-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Week {focusedWeek + 1} Detail</h3>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                  {getWeekLoad(focusedWeek).toFixed(1)}h planned · 
                  <span style={{ marginLeft: '0.5rem', color: focusedWeek < currentWeek ? 'var(--success)' : focusedWeek === currentWeek ? 'var(--primary)' : 'var(--muted)' }}>
                    {focusedWeek < currentWeek ? 'Archived' : focusedWeek === currentWeek ? '📍 Active' : 'Forward Look'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="button secondary" style={{ padding: '0.5rem' }} 
                  onClick={() => setFocusedWeek(Math.max(0, focusedWeek - 1))}>←</button>
                <button className="button secondary" style={{ padding: '0.5rem' }} 
                  onClick={() => setFocusedWeek(Math.min(totalWeeks - 1, focusedWeek + 1))}>→</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {getTasksForWeek(focusedWeek).length === 0 ? (
                <div className="empty-state" style={{ padding: '3rem' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📭</div>
                  No tasks scheduled for this period
                </div>
              ) : (
                getTasksForWeek(focusedWeek).map(task => (
                  <div 
                    key={task.core.id}
                    className={`task-block hoverable ${task.execution.status}`}
                    onClick={() => setSelectedTask(selectedTask?.core.id === task.core.id ? null : task)}
                    style={{ 
                      outline: selectedTask?.core.id === task.core.id ? '2px solid var(--primary)' : 'none',
                      background: selectedTask?.core.id === task.core.id ? 'var(--bg-elevated)' : 'var(--card)'
                    }}
                  >
                    <div className={`task-dot ${task.core.kind}`} style={{ width: '10px', height: '10px' }} />
                    <div style={{ flex: 1 }}>
                      <div className="task-title" style={{ fontWeight: 600 }}>{task.core.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                        {task.core.kind.replace('_', ' ')} · {task.links.skillId?.replace(/_/g, ' ') ?? 'general'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{task.core.estimatedHours}h</div>
                      <StatusBadge status={task.execution.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Inspector & Stats ──────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Global Stats */}
          <div className="card outline">
            <div className="section-title">Timeline Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <StatRow label="Target Completion" value={`Wk ${totalWeeks}`} />
              <StatRow label="Active Goal" value={activeRoute?.meta.label ?? '—'} />
              <StatRow label="Remaining Tasks" value={`${tasks.filter(t => t.execution.status === 'planned').length}`} />
              <StatRow label="Capacity Utilization" value={`${Math.round((getWeekLoad(focusedWeek) / maxHoursPerWeek) * 100)}%`} />
            </div>
          </div>

          {/* Task Inspector */}
          {selectedTask ? (
            <div className="card glass-card scale-in" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>Inspector</div>
                <button className="button ghost" style={{ padding: '0' }} onClick={() => setSelectedTask(null)}>✕</button>
              </div>
              
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{selectedTask.core.title}</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {selectedTask.core.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <MiniInfo label="Kind" value={selectedTask.core.kind} />
                <MiniInfo label="Hours" value={`${selectedTask.core.estimatedHours}h`} />
                <MiniInfo label="Skill" value={selectedTask.links.skillId?.replace(/_/g, ' ') ?? '—'} />
                <MiniInfo label="Status" value={selectedTask.execution.status} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {selectedTask.execution.status === 'planned' && (
                  <>
                    <button className="button primary-gradient" onClick={() => { completeTask(selectedTask.core.id, selectedTask.core.estimatedHours); setSelectedTask(null); }}>
                      Mark as Complete
                    </button>
                    <button className="button secondary" onClick={() => { skipTask(selectedTask.core.id, 'manual_skip'); setSelectedTask(null); }}>
                      Skip Task
                    </button>
                  </>
                )}
                
                <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>Reschedule to Week</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="number" 
                      className="input" 
                      style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '4px', color: '#fff' }}
                      min={currentWeek + 1}
                      max={totalWeeks}
                      placeholder="Wk #"
                      onChange={e => setRescheduleTarget(Number(e.target.value))}
                    />
                    <button className="button secondary" onClick={() => {
                      if (rescheduleTarget && rescheduleTarget > 0) {
                        rescheduleTask(selectedTask.core.id, rescheduleTarget - 1);
                        setSelectedTask(null);
                      }
                    }}>Move</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card flat" style={{ border: '1px dashed var(--border)', textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>📑</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Select a task to inspect or modify its state</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { c: string; bg: string }> = {
    completed: { c: 'var(--success)', bg: 'rgba(34,197,94,0.1)' },
    in_progress: { c: 'var(--primary)', bg: 'rgba(79,140,255,0.1)' },
    planned: { c: 'var(--muted)', bg: 'rgba(255,255,255,0.05)' },
    skipped: { c: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' },
  };
  const s = map[status] ?? map.planned;
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: s.c, background: s.bg, padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
      {status}
    </span>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{value}</div>
    </div>
  );
}
