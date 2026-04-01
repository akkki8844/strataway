'use client';

import React, { useState } from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { useRouteStore } from '../../store/routeStore';
import { Task } from '../../../types/task';
import Link from 'next/link';

export default function TimelinePage() {
  const { tasks, currentWeek, maxHoursPerWeek, completeTask, skipTask, rescheduleTask, adaptToCapacityChange, getWeekLoad } = useTimelineStore();
  const { routes, activeRouteId } = useRouteStore();
  const activeRoute = routes.find(r => r.meta.id === activeRouteId);

  const [focusedWeek, setFocusedWeek] = useState(currentWeek);
  const [newMaxHours, setNewMaxHours] = useState(maxHoursPerWeek);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [rescheduleWeek, setRescheduleWeek] = useState('');
  const [showCapacityPanel, setShowCapacityPanel] = useState(false);

  const totalWeeks = activeRoute?.weeks ?? 36;
  // Build week range: show 8 weeks around current
  const visibleWeeks = Array.from({ length: totalWeeks }, (_, i) => i);

  const getTasksForWeek = (w: number) => tasks.filter(t => t.core.weekIndex === w);
  const getWeekStatus = (w: number) => {
    const load = getWeekLoad(w);
    const pct = load / maxHoursPerWeek;
    if (pct > 1) return 'overload';
    if (pct > 0.75) return 'heavy';
    if (pct > 0.25) return 'moderate';
    if (pct > 0) return 'light';
    return 'empty';
  };

  const completedCount = tasks.filter(t => t.execution.status === 'completed').length;
  const completionPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="slide-up">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Timeline Planner</h1>
          <p className="page-subtitle">
            {activeRoute?.meta.label} · {tasks.length} tasks across {totalWeeks} weeks ·{' '}
            <span style={{ color: 'var(--success)' }}>{completionPct}% complete</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="button secondary" style={{ fontSize: '0.825rem' }}
            onClick={() => setShowCapacityPanel(!showCapacityPanel)}>
            ⚙ Adjust Capacity
          </button>
          <Link href="/analytics">
            <button className="button ghost" style={{ fontSize: '0.825rem' }}>Analytics →</button>
          </Link>
        </div>
      </div>

      {/* ── Capacity Adjustment Banner ─────────────────────────────────── */}
      {showCapacityPanel && (
        <div className="card outline scale-in" style={{
          marginBottom: '1.5rem',
          background: 'rgba(79,140,255,0.05)',
          border: '1px solid rgba(79,140,255,0.25)',
        }}>
          <div className="section-title" style={{ marginBottom: '0.75rem' }}>Adapt Timeline Capacity</div>
          <p style={{ fontSize: '0.825rem', color: 'var(--muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
            Changing your weekly capacity will automatically reschedule all <em>planned</em> and <em>skipped</em> tasks
            to fit within the new limit. Completed and in-progress tasks are preserved.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>New max hours/week: <strong style={{ color: 'var(--text)' }}>{newMaxHours}h</strong></label>
              <input type="range" min={3} max={30} value={newMaxHours}
                onChange={e => setNewMaxHours(Number(e.target.value))}
                style={{ width: 220, accentColor: 'var(--primary)', cursor: 'pointer' }} />
            </div>
            <button className="button" style={{ fontSize: '0.825rem' }}
              onClick={() => { adaptToCapacityChange(newMaxHours); setShowCapacityPanel(false); }}>
              Apply & Recalculate
            </button>
            <button className="button ghost" style={{ fontSize: '0.825rem' }}
              onClick={() => setShowCapacityPanel(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
        {/* ── Left: Week overview strip + week view ────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Mini heatmap strip */}
          <div className="card outline">
            <div className="section-header">
              <div className="section-title">Week Overview</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Click a week to focus · Current: Wk {currentWeek + 1}</div>
            </div>
            <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '3px', minWidth: 'max-content' }}>
                {visibleWeeks.map(w => {
                  const s = getWeekStatus(w);
                  const isCurrent = w === currentWeek;
                  const isFocused = w === focusedWeek;
                  const color = s === 'overload' ? '#ef4444'
                    : s === 'heavy' ? '#f59e0b'
                    : s === 'moderate' ? '#4f8cff'
                    : s === 'light' ? 'rgba(79,140,255,0.35)'
                    : 'rgba(255,255,255,0.05)';
                  return (
                    <div
                      key={w}
                      onClick={() => setFocusedWeek(w)}
                      title={`Week ${w + 1}: ${getWeekLoad(w).toFixed(1)}h`}
                      style={{
                        width: 14, height: 40, borderRadius: 3,
                        background: color,
                        cursor: 'pointer',
                        outline: isFocused ? '2px solid var(--primary)' : isCurrent ? '2px solid rgba(79,140,255,0.5)' : 'none',
                        outlineOffset: '1px',
                        flexShrink: 0,
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scaleY(1.15)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Week 1</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Week {totalWeeks}</span>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { color: 'rgba(255,255,255,0.05)', label: 'Empty' },
                { color: 'rgba(79,140,255,0.35)', label: 'Light' },
                { color: '#4f8cff', label: 'Moderate' },
                { color: '#f59e0b', label: 'Heavy' },
                { color: '#ef4444', label: 'Overload' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', color: 'var(--muted)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Focused week view */}
          <div className="card outline">
            <div className="section-header">
              <div>
                <div className="section-title">Week {focusedWeek + 1} Detail</div>
                <div className="section-subtitle">
                  {getWeekLoad(focusedWeek).toFixed(1)}h of {maxHoursPerWeek}h ·{' '}
                  {focusedWeek < currentWeek ? '✓ Past' : focusedWeek === currentWeek ? '📍 Current' : '→ Future'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button className="button secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem' }}
                  onClick={() => setFocusedWeek(Math.max(0, focusedWeek - 1))}>←</button>
                <button className="button secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem' }}
                  onClick={() => setFocusedWeek(Math.min(totalWeeks - 1, focusedWeek + 1))}>→</button>
              </div>
            </div>

            {/* Capacity bar */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Planned hours</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: getWeekLoad(focusedWeek) > maxHoursPerWeek ? 'var(--danger)' : 'var(--text)' }}>
                  {getWeekLoad(focusedWeek).toFixed(1)} / {maxHoursPerWeek}h
                </span>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{
                  width: `${Math.min(100, (getWeekLoad(focusedWeek) / maxHoursPerWeek) * 100)}%`,
                  background: getWeekLoad(focusedWeek) > maxHoursPerWeek
                    ? 'linear-gradient(90deg,var(--danger),#f87171)'
                    : 'linear-gradient(90deg,var(--primary),#7aa7ff)',
                }} />
              </div>
            </div>

            {getTasksForWeek(focusedWeek).length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🗓</div>
                No tasks in this week
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {getTasksForWeek(focusedWeek).map(task => (
                  <div key={task.core.id}
                    className={`task-block ${task.execution.status}`}
                    onClick={() => setSelectedTask(selectedTask?.core.id === task.core.id ? null : task)}
                    style={{ outline: selectedTask?.core.id === task.core.id ? '1px solid var(--primary)' : 'none' }}>
                    <div className={`task-dot ${task.core.kind}`} />
                    <div style={{ flex: 1 }}>
                      <div className="task-title">{task.core.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                        {task.core.kind} · {task.links.skillId?.replace(/_/g, ' ') ?? 'general'}
                        {task.adjustment.rescheduledFromWeekIndex !== null && (
                          <span style={{ color: 'var(--warning)', marginLeft: '0.5rem' }}>
                            Moved from Wk {(task.adjustment.rescheduledFromWeekIndex ?? 0) + 1}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="task-hours">{task.core.estimatedHours}h</div>
                    <TaskStatusBadge status={task.execution.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Task inspector + nav ───────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Jump to week */}
          <div className="card outline">
            <div className="section-title" style={{ marginBottom: '0.75rem' }}>Week Navigation</div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <button className="button secondary" style={{ flex: 1, fontSize: '0.8rem' }}
                onClick={() => setFocusedWeek(currentWeek)}>Current (Wk {currentWeek + 1})</button>
              <button className="button secondary" style={{ flex: 1, fontSize: '0.8rem' }}
                onClick={() => setFocusedWeek(0)}>First</button>
            </div>
            {/* All tasks summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {['completed', 'in_progress', 'planned', 'skipped'].map(s => {
                const count = tasks.filter(t => t.execution.status === s).length;
                const color = s === 'completed' ? '#4ade80' : s === 'in_progress' ? '#6ea2ff' : s === 'skipped' ? 'var(--danger)' : 'var(--muted)';
                return (
                  <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'capitalize' }}>{s.replace('_', ' ')}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task Inspector */}
          {selectedTask ? (
            <div className="card outline scale-in">
              <div className="section-header">
                <div className="section-title">Task Inspector</div>
                <button className="button ghost" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                  onClick={() => setSelectedTask(null)}>✕</button>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>
                  {selectedTask.core.title}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                  {selectedTask.core.description}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <MiniStat label="Kind" value={selectedTask.core.kind} />
                <MiniStat label="Hours" value={`${selectedTask.core.estimatedHours}h`} />
                <MiniStat label="Skill" value={selectedTask.links.skillId?.replace(/_/g, ' ') ?? '—'} />
                <MiniStat label="Status" value={selectedTask.execution.status.replace('_', ' ')} />
                {selectedTask.execution.actualHours !== null && (
                  <MiniStat label="Actual Hours" value={`${selectedTask.execution.actualHours}h`} />
                )}
                {selectedTask.execution.completedAt && (
                  <MiniStat label="Completed" value={selectedTask.execution.completedAt.slice(0, 10)} />
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {selectedTask.execution.status !== 'completed' && (
                  <button className="button success" style={{ fontSize: '0.8rem', width: '100%' }}
                    onClick={() => { completeTask(selectedTask.core.id, selectedTask.core.estimatedHours); setSelectedTask(null); }}>
                    ✓ Mark Complete
                  </button>
                )}
                {selectedTask.execution.status === 'planned' && (
                  <button className="button secondary" style={{ fontSize: '0.8rem', width: '100%' }}
                    onClick={() => { skipTask(selectedTask.core.id, 'manual_skip'); setSelectedTask(null); }}>
                    ⊘ Skip Task
                  </button>
                )}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="number" placeholder="Week #" value={rescheduleWeek}
                    onChange={e => setRescheduleWeek(e.target.value)}
                    className="input" style={{ fontSize: '0.8rem', padding: '0.4rem 0.5rem' }}
                    min={1} max={totalWeeks}
                  />
                  <button className="button secondary" style={{ fontSize: '0.8rem', flexShrink: 0 }}
                    onClick={() => {
                      const w = parseInt(rescheduleWeek, 10);
                      if (!isNaN(w) && w >= 1 && w <= totalWeeks) {
                        rescheduleTask(selectedTask.core.id, w - 1);
                        setRescheduleWeek('');
                        setSelectedTask(null);
                      }
                    }}>Move</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card flat" style={{
              border: '1px dashed var(--border)', padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.825rem',
            }}>
              Click a task to inspect, complete, skip, or reschedule it
            </div>
          )}

          {/* Milestones checklist */}
          {activeRoute && (
            <div className="card outline">
              <div className="section-title" style={{ marginBottom: '0.75rem' }}>Milestones</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {activeRoute.milestones.map(m => {
                  const reached = m.targetWeekIndex < currentWeek;
                  return (
                    <div key={m.id} style={{
                      display: 'flex', gap: '0.65rem', alignItems: 'center',
                      opacity: reached ? 0.5 : 1,
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${reached ? '#22c55e' : m.isCritical ? 'var(--primary)' : 'var(--border)'}`,
                        background: reached ? '#22c55e' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', color: '#fff',
                      }}>{reached ? '✓' : ''}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text)' }}>{m.title}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Week {m.targetWeekIndex + 1}</div>
                      </div>
                      {m.isCritical && <span style={{ fontSize: '0.6rem', color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '0.1rem 0.35rem', borderRadius: 99 }}>critical</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TaskStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { c: string; bg: string }> = {
    completed: { c: '#4ade80', bg: 'rgba(34,197,94,0.15)' },
    in_progress: { c: '#6ea2ff', bg: 'rgba(79,140,255,0.15)' },
    planned: { c: 'var(--muted)', bg: 'rgba(255,255,255,0.06)' },
    skipped: { c: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  };
  const s = cfg[status] ?? cfg.planned;
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: s.c, background: s.bg, padding: '0.15rem 0.45rem', borderRadius: 99, flexShrink: 0 }}>
      {status.replace('_', ' ')}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-xs)' }}>
      <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: '0.1rem' }}>{label}</div>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{value}</div>
    </div>
  );
}
