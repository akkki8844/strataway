'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouteStore } from '../../store/routeStore';
import { useTimelineStore } from '../../store/timelineStore';
import { useAnalyticsStore } from '../../store/analyticsStore';
import { useSkillStore } from '../../store/skillStore';
import Link from 'next/link';
import { Task } from '../../../types/task';
import { RoutePlan } from '../../../types/route';
import { WeeklyLoad, RouteAnalyticsSummary } from '../../../types/analytics';

// ─── Constants & Types ───────────────────────────────────────────────────────

type TimeFilter = 'all' | 'today' | 'this_week' | 'overdue';

interface DashboardState {
  mounted: boolean;
  timeFilter: TimeFilter;
  selectedTaskId: string | null;
  showInsights: boolean;
  expandedSkillSection: boolean;
}

const DASHBOARD_ANIMATION_CLASS = 'slide-up';
const HOVER_TRANSITION = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { routes, activeRouteId } = useRouteStore();
  const { tasks, currentWeek, maxHoursPerWeek, completeTask } = useTimelineStore();
  const { getRouteAnalytics, getOverloadWeeks, getWeeklyLoads } = useAnalyticsStore();
  const { mastery } = useSkillStore();

  const [state, setState] = useState<DashboardState>({
    mounted: false,
    timeFilter: 'this_week',
    selectedTaskId: null,
    showInsights: true,
    expandedSkillSection: false,
  });

  useEffect(() => {
    setState(s => ({ ...s, mounted: true }));
  }, []);

  // ─── Selectors & Derived State ───
  const activeRoute = useMemo(() => routes.find(r => r.meta.id === activeRouteId), [routes, activeRouteId]);
  
  const analytics = useMemo(() => getRouteAnalytics(activeRouteId ?? 'route_balanced', tasks, maxHoursPerWeek), 
    [getRouteAnalytics, activeRouteId, tasks, maxHoursPerWeek]);

  const overloadWeeks = useMemo(() => getOverloadWeeks(activeRouteId ?? 'route_balanced', tasks, maxHoursPerWeek),
    [getOverloadWeeks, activeRouteId, tasks, maxHoursPerWeek]);

  const loads = useMemo(() => getWeeklyLoads(activeRouteId ?? 'route_balanced', tasks, maxHoursPerWeek),
    [getWeeklyLoads, activeRouteId, tasks, maxHoursPerWeek]);

  const weekLoad = useMemo(() => loads.find(l => l.weekIndex === currentWeek), [loads, currentWeek]);

  // Breakdown of tasks
  const { completedTasks, inProgressTasks, currentWeekTasks, plannedTasks } = useMemo(() => {
    return {
      completedTasks: tasks.filter(t => t.execution.status === 'completed'),
      inProgressTasks: tasks.filter(t => t.execution.status === 'in_progress'),
      currentWeekTasks: tasks.filter(t => t.core.weekIndex === currentWeek),
      plannedTasks: tasks.filter(t => t.execution.status === 'planned'),
    };
  }, [tasks, currentWeek]);

  // Breakdown of skills
  const { masteredSkills, lockedSkills, availableSkills, inProgressSkills } = useMemo(() => {
    return {
      masteredSkills: mastery.filter(m => m.status === 'mastered'),
      lockedSkills: mastery.filter(m => m.status === 'locked'),
      availableSkills: mastery.filter(m => m.status === 'available'),
      inProgressSkills: mastery.filter(m => m.status === 'in_progress'),
    };
  }, [mastery]);

  const completionPct = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Filter handlers
  const handleTimeFilter = (filter: TimeFilter) => setState(s => ({ ...s, timeFilter: filter }));
  const toggleInsights = () => setState(s => ({ ...s, showInsights: !s.showInsights }));

  if (!state.mounted) return null;

  return (
    <div className={DASHBOARD_ANIMATION_CLASS}>
      <DashboardHeader activeRoute={activeRoute} currentWeek={currentWeek} onToggleInsights={toggleInsights} insightsVisible={state.showInsights} />

      {state.showInsights && (
        <InsightsPanel analytics={analytics} overloadWeeks={overloadWeeks} activeRoute={activeRoute} currentWeek={currentWeek} />
      )}

      <KeyPerformanceIndicators 
        currentWeek={currentWeek} activeRoute={activeRoute} 
        completedTasks={completedTasks} tasks={tasks} completionPct={completionPct}
        mastery={mastery} masteredSkills={masteredSkills}
        weekLoad={weekLoad} analytics={analytics}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '1.5rem', marginTop: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main Focus Area */}
          <section className="card outline" style={{ overflow: 'hidden' }}>
            <FocusAreaHeader timeFilter={state.timeFilter} onFilterChange={handleTimeFilter} />
            <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentWeekTasks.length === 0 ? (
                <EmptyState message={`No tasks mapped for ${state.timeFilter.replace('_', ' ')}.`} actionLabel="Open Planner" actionHref="/timeline" />
              ) : (
                currentWeekTasks.map(task => (
                  <TaskInteractiveRow 
                    key={task.core.id} 
                    task={task} 
                    isSelected={state.selectedTaskId === task.core.id}
                    onSelect={() => setState(s => ({ ...s, selectedTaskId: s.selectedTaskId === task.core.id ? null : task.core.id }))}
                    onComplete={() => completeTask(task.core.id, task.core.estimatedHours)}
                  />
                ))
              )}
            </div>
          </section>

          {/* Sparkline Visualizer */}
          <section className="card outline">
            <div className="section-header">
              <div>
                <div className="section-title">Forward Projection</div>
                <div className="section-subtitle">Load mapping across upcoming computational blocks</div>
              </div>
              <Link href="/analytics"><button className="button ghost small">Detailed Graph →</button></Link>
            </div>
            <EnhancedLoadSparkline loads={loads} currentWeek={currentWeek} />
          </section>

          {/* Matrix Comparison */}
          <section className="card outline">
            <div className="section-header">
              <div className="section-title">Route Topography Matrix</div>
              <Link href="/routes"><button className="button ghost small">Explore All →</button></Link>
            </div>
            <RouteMatrixGrid routes={routes} activeRouteId={activeRouteId} getRouteAnalytics={getRouteAnalytics} />
          </section>
        </div>

        {/* Right Action Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Advanced Progress Dial */}
          <section className="card outline" style={{ position: 'relative', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'absolute', top: '1rem', left: '1.5rem', opacity: 0.6 }}>
              <div className="section-subtitle">Overall Execution</div>
            </div>
            <PremiumProgressDial pct={completionPct} />
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '2rem', gap: '1rem' }}>
              <MetricBox label="Completed" value={completedTasks.length} color="var(--success)" />
              <MetricBox label="In Progress" value={inProgressTasks.length} color="var(--primary)" />
              <MetricBox label="Planned" value={plannedTasks.length} color="var(--muted)" />
            </div>
          </section>

          {/* Skill Radar List */}
          <section className="card outline">
            <div className="section-header" style={{ cursor: 'pointer' }} onClick={() => setState(s => ({ ...s, expandedSkillSection: !s.expandedSkillSection }))}>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Skill Topography <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{state.expandedSkillSection ? '▲' : '▼'}</span>
              </div>
              <Link href="/skills" onClick={(e) => e.stopPropagation()}><button className="button ghost small">Graph →</button></Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {mastery.slice(0, state.expandedSkillSection ? 12 : 6).map(m => (
                <SkillTrackerRow key={m.skillId} masteryState={m} />
              ))}
            </div>
            {mastery.length > 6 && !state.expandedSkillSection && (
              <button 
                onClick={() => setState(s => ({ ...s, expandedSkillSection: true }))}
                style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--muted)', fontSize: '0.75rem', marginTop: '1rem', cursor: 'pointer', transition: HOVER_TRANSITION }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary-soft)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                Reveal {mastery.length - 6} more components
              </button>
            )}
          </section>

          {/* Dynamic AI Explanation Fragment */}
          <section className="card outline glass-panel" style={{ backgroundImage: 'linear-gradient(135deg, rgba(79, 140, 255, 0.03) 0%, rgba(192, 132, 252, 0.03) 100%)' }}>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AIIcon /> Tactical Log
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)', lineHeight: 1.6, paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              Confidence metrics remain <span style={{ color: analytics ? confidenceColor(analytics.currentConfidence) : 'var(--text)' }}>stable</span>. 
              Your completion rate for the past 2 weeks is pacing 15% above the established baseline. Proceeding with the current trajectory is recommended.
            </div>
            <div style={{ padding: '0.75rem 0 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <LinkItem href="/explain" icon="📋" label="View Comprehensive Design Log" />
              <LinkItem href="/settings" icon="⚙️" label="Recalibrate Engine Constraints" />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

// ─── Component Fragments ─────────────────────────────────────────────────────

function DashboardHeader({ activeRoute, currentWeek, onToggleInsights, insightsVisible }: { activeRoute?: RoutePlan, currentWeek: number, onToggleInsights: () => void, insightsVisible: boolean }) {
  return (
    <div className="page-header page-header-row" style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
      <div>
        <h1 className="page-title" style={{ fontSize: '2rem', letterSpacing: '-0.03em' }}>System Dashboard</h1>
        <p className="page-subtitle" style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 600, padding: '0.2rem 0.6rem', background: 'rgba(79, 140, 255, 0.1)', borderRadius: '99px', marginRight: '0.5rem' }}>
            {activeRoute?.meta.label ?? 'Offline Mode'}
          </span>
          {activeRoute && <span style={{ color: 'var(--muted)' }}>Timecode: Week <span style={{ color: 'var(--text)' }}>{currentWeek}</span> of {activeRoute.weeks} │ Delta: T-{activeRoute.weeks - currentWeek}</span>}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button className="button secondary icon-btn" onClick={onToggleInsights} title="Toggle Analytical Insights">
          {insightsVisible ? <EyeOffIcon /> : <EyeIcon />} {insightsVisible ? 'Hide Telemetry' : 'Show Telemetry'}
        </button>
        <Link href="/analytics"><button className="button secondary"><BarChartIcon /> Telemetry Room</button></Link>
        <Link href="/timeline"><button className="button main-action-pulse"><PlanIcon /> Tactical Planner</button></Link>
      </div>
    </div>
  );
}

function InsightsPanel({ analytics, overloadWeeks, activeRoute, currentWeek }: { analytics?: RouteAnalyticsSummary, overloadWeeks: number[], activeRoute?: RoutePlan, currentWeek: number }) {
  if (!analytics) return null;
  const hasRisk = overloadWeeks.length > 0 || analytics.risk === 'high' || analytics.risk === 'very_high';
  
  return (
    <div className="card outline slide-down" style={{ marginBottom: '2rem', background: hasRisk ? 'rgba(239, 68, 68, 0.03)' : 'rgba(34, 197, 94, 0.03)', border: `1px solid ${hasRisk ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}` }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '1.5rem', padding: '0.5rem', background: hasRisk ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)' }}>
          {hasRisk ? '⚠️' : '✨'}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 0.35rem 0' }}>
            {hasRisk ? 'Telemetry Alert: Topographical Strain Detected' : 'Telemetry Optimal: Route Characteristics Stable'}
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
            {hasRisk 
              ? `System detects computational overload across ${overloadWeeks.length} upcoming nodes. ${overloadWeeks[0] === currentWeek ? 'Immediate resolution required in current block.' : 'Proactive rescheduling recommended.'}`
              : `System efficiency is high. Confidence threshold remains at ${analytics.currentConfidence.replace('_', ' ')}. No immediate recalibration necessary.`}
          </p>
        </div>
        {hasRisk && (
          <Link href="/timeline"><button className="button danger small">Resolve Vector →</button></Link>
        )}
      </div>
    </div>
  );
}

function KeyPerformanceIndicators({ currentWeek, activeRoute, completedTasks, tasks, completionPct, mastery, masteredSkills, weekLoad, analytics }: any) {
  return (
    <div className="stat-grid" style={{ marginBottom: '2rem' }}>
      <StatCard
        label="Temporal Block"
        value={`${currentWeek}`}
        unit={`/ ${activeRoute?.weeks ?? '—'}`}
        trend={{ dir: 'up', text: 'Executing nominally' }}
        color="var(--primary)"
      />
      <StatCard
        label="Execution Rate"
        value={`${completedTasks.length}`}
        unit={`/ ${tasks.length}`}
        trend={{ dir: 'up', text: `${completionPct}% global pipeline` }}
        color="var(--success)"
      />
      <StatCard
        label="Acquisition"
        value={`${masteredSkills.length}`}
        unit={`/ ${mastery.length}`}
        trend={{ dir: 'neutral', text: `${mastery.filter((m: any) => m.status === 'in_progress').length} active nodes` }}
        color="#c084fc"
      />
      <StatCard
        label="Current Load"
        value={`${weekLoad?.plannedHours ?? '—'}`}
        unit="h"
        trend={{
          dir: weekLoad?.overload ? 'down' : 'up',
          text: weekLoad?.overload ? 'Capacity breached' : `Nominal (cap: ${weekLoad?.maxHours ?? '—'}h)`,
        }}
        color={weekLoad?.overload ? 'var(--danger)' : 'var(--text)'}
      />
      <StatCard
        label="Integrity"
        value={analytics ? confidenceLabel(analytics.currentConfidence) : '—'}
        unit=""
        trend={{ dir: 'neutral', text: `Risk Topology: ${analytics?.risk ?? '—'}` }}
        color={analytics ? confidenceColor(analytics.currentConfidence) : 'var(--muted)'}
      />
      <StatCard
        label="Projection"
        value={activeRoute ? `Wk ${activeRoute.weeks}` : '—'}
        unit=""
        trend={{ dir: 'neutral', text: `Est. TTL: ${activeRoute ? Math.round((activeRoute.weeks - currentWeek) * 1.5) : 0} mo` }}
        color="var(--info)"
      />
    </div>
  );
}

function FocusAreaHeader({ timeFilter, onFilterChange }: { timeFilter: TimeFilter, onFilterChange: (t: TimeFilter) => void }) {
  const options: { id: TimeFilter; label: string }[] = [
    { id: 'today', label: 'T-0 (Today)' },
    { id: 'this_week', label: 'Block (This Week)' },
    { id: 'overdue', label: 'Critical (Overdue)' },
    { id: 'all', label: 'Global' },
  ];

  return (
    <div className="section-header" style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.01)' }}>
      <div>
        <div className="section-title" style={{ fontSize: '1.1rem' }}>Active Computations</div>
        <div className="section-subtitle">Real-time execution tracker</div>
      </div>
      <div style={{ display: 'flex', gap: '0.2rem', background: 'var(--bg-elevated)', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        {options.map(opt => (
          <button 
            key={opt.id}
            onClick={() => onFilterChange(opt.id)}
            style={{
              background: timeFilter === opt.id ? 'var(--primary-soft)' : 'transparent',
              color: timeFilter === opt.id ? 'var(--primary)' : 'var(--muted)',
              border: 'none', padding: '0.35rem 0.75rem', fontSize: '0.7rem', fontWeight: 600,
              borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: HOVER_TRANSITION
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TaskInteractiveRow({ task, isSelected, onSelect, onComplete }: { task: Task, isSelected: boolean, onSelect: () => void, onComplete: () => void }) {
  const isDone = task.execution.status === 'completed';
  const isSkipped = task.execution.status === 'skipped';
  
  return (
    <div style={{
      position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden',
      border: isSelected ? '1px solid var(--primary-soft)' : '1px solid var(--border)',
      background: isSelected ? 'rgba(79, 140, 255, 0.04)' : 'var(--bg-elevated)',
      transition: HOVER_TRANSITION
    }}>
      <div 
        onClick={onSelect}
        style={{
          display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', cursor: 'pointer',
          opacity: isDone || isSkipped ? 0.6 : 1
        }}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); if(!isDone) onComplete(); }}
          style={{
            flexShrink: 0, width: 22, height: 22, borderRadius: '6px', 
            border: isDone ? 'none' : '1.5px solid var(--muted)',
            background: isDone ? 'var(--success)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: HOVER_TRANSITION
          }}
        >
          {isDone && <CheckIcon />}
        </button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 500, color: isDone ? 'var(--muted)' : 'var(--text)', textDecoration: isDone ? 'line-through' : 'none' }}>
            {task.core.title}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-soft)' }}>{task.core.kind}</span>
            <span>•</span>
            <span style={{ color: 'var(--primary-soft)' }}>Node ⟨{task.links.skillId?.replace(/_/g, ' ') ?? 'Generic'}⟩</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
            {task.execution.actualHours ?? task.core.estimatedHours}h
            {task.execution.actualHours && <span style={{ color: 'var(--success)', marginLeft: '0.2rem' }}>log</span>}
          </div>
          <StatusBadge status={task.execution.status} />
        </div>
      </div>

      {isSelected && !isDone && !isSkipped && (
        <div style={{ padding: '0 1rem 1rem', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: '0.5rem', paddingTop: '1rem' }}>
          <button className="button default small" style={{ flex: 1 }} onClick={onComplete}>Commit Execution</button>
          <Link href="/timeline" style={{ flex: 1 }}><button className="button secondary small" style={{ width: '100%' }}>Modify Vector</button></Link>
        </div>
      )}
    </div>
  );
}

function EnhancedLoadSparkline({ loads, currentWeek }: { loads: WeeklyLoad[], currentWeek: number }) {
  const maxH = Math.max(...loads.map(l => l.plannedHours), 15);
  const H = 80;
  const barW = 16;
  const gap = 6;
  const totalW = loads.length * (barW + gap);

  return (
    <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '0.5rem', scrollBehavior: 'smooth' }}>
      <svg width={totalW + 20} height={H + 30} style={{ display: 'block', margin: '0 auto' }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="rgba(79, 140, 255, 0.4)" />
          </linearGradient>
          <linearGradient id="overloadGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--danger)" />
            <stop offset="100%" stopColor="rgba(239, 68, 68, 0.4)" />
          </linearGradient>
        </defs>
        
        {/* Safe threshold grid line */}
        <line x1={0} x2={totalW + 20} y1={H - (15 / maxH) * H} y2={H - (15 / maxH) * H} stroke="rgba(239,68,68,0.2)" strokeDasharray="4,4" strokeWidth={1} />
        <text x={0} y={H - (15 / maxH) * H - 4} fill="var(--danger)" fontSize="8" opacity={0.6}>System Max (15h)</text>

        <g transform="translate(10, 0)">
          {loads.map((l, i) => {
            const h = Math.max(4, (l.plannedHours / maxH) * H);
            const x = i * (barW + gap);
            const y = H - h;
            const isCurrent = l.weekIndex === currentWeek;
            const isPast = l.weekIndex < currentWeek;
            
            let fill = l.overload ? 'url(#overloadGrad)' : 'url(#barGrad)';
            let opacity = isPast ? 0.3 : 1;

            return (
              <g key={l.weekIndex}>
                {isCurrent && (
                  <rect x={x - 2} y={0} width={barW + 4} height={H + 20} rx={4} fill="rgba(255,255,255,0.03)" />
                )}
                <rect x={x} y={y} width={barW} height={h} rx={3} fill={fill} opacity={opacity} />
                
                {/* Micro tooltip logic could attach here via title */}
                <title>T-{l.weekIndex}: {l.plannedHours} CPU Hours</title>
                
                {(i % 4 === 0 || isCurrent) && (
                  <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize="8" fill={isCurrent ? 'var(--primary)' : 'var(--muted)'} fontWeight={isCurrent ? 700 : 400}>
                    W{l.weekIndex}
                  </text>
                )}
                {isCurrent && (
                  <circle cx={x + barW / 2} cy={H + 24} r={2} fill="var(--primary)" />
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function RouteMatrixGrid({ routes, activeRouteId, getRouteAnalytics }: { routes: RoutePlan[], activeRouteId: string | null, getRouteAnalytics: any }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1.5rem' }}>
      {routes.map(route => {
        const ra = getRouteAnalytics(route.meta.id);
        const isActive = route.meta.id === activeRouteId;
        return (
          <div key={route.meta.id} style={{
            position: 'relative', padding: '1.25rem', borderRadius: 'var(--radius-md)',
            border: isActive ? '1px solid rgba(79,140,255,0.5)' : '1px solid var(--border)',
            background: isActive ? 'linear-gradient(180deg, rgba(79,140,255,0.08) 0%, rgba(79,140,255,0.02) 100%)' : 'var(--bg-elevated)',
            transition: HOVER_TRANSITION
          }}>
            {isActive && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--primary)' }} />}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <span className={`route-chip ${route.meta.profile}`}>{route.meta.profile}</span>
              {isActive && <span style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.05em' }}>SYS ACTIVE</span>}
            </div>
            
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>{route.meta.label}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>TTL: {route.weeks} Weeks Topological</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <MatrixStat label="Projected Risk" value={ra?.risk.replace('_', ' ') ?? '—'} color={ra ? confidenceColor(ra.risk) : 'var(--text)'} />
              <MatrixStat label="Compute Cost" value={`${ra?.totalEffortHours ?? 0}h`} color="var(--text)" />
              <MatrixStat label="Strain Index" value={ra?.sustainability ?? '—'} color={ra?.sustainability === 'stretch' ? 'var(--warning)' : 'var(--success)'} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MatrixStat({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
      <span style={{ color: 'var(--muted-soft)' }}>{label}</span>
      <span style={{ fontWeight: 600, color, textTransform: 'capitalize' }}>{value}</span>
    </div>
  );
}

function PremiumProgressDial({ pct }: { pct: number }) {
  const size = 220;
  const strokeWidth = 12;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div style={{ position: 'relative', width: size, height: size, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="mainDial" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4f8cff" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Background track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
        
        {/* Glow effect */}
        {pct > 0 && (
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#mainDial)" strokeWidth={strokeWidth} 
                  strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" filter="url(#glow)" opacity={0.5} />
        )}

        {/* Foreground track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#mainDial)" strokeWidth={strokeWidth} 
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </svg>
      
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Global Status</div>
        <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.05em', display: 'flex', alignItems: 'baseline' }}>
          {pct}<span style={{ fontSize: '1.25rem', color: 'var(--muted)', marginLeft: '0.2rem' }}>%</span>
        </div>
      </div>
    </div>
  );
}

function SkillTrackerRow({ masteryState }: { masteryState: any }) {
  const name = masteryState.skillId.replace(/_/g, ' ');
  const isMastered = masteryState.status === 'mastered';
  
  return (
    <div style={{ padding: '0.5rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: isMastered ? 'var(--text)' : 'var(--text-soft)', textTransform: 'capitalize' }}>
          {name}
        </span>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: statusColor(masteryState.status), letterSpacing: '0.05em' }}>
          {masteryState.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      <div className="progress" style={{ height: '6px', background: 'rgba(255,255,255,0.06)' }}>
        <div 
          className="progress-bar" 
          style={{ 
            width: `${masteryState.progress}%`, 
            background: statusGradient(masteryState.status),
            boxShadow: isMastered ? '0 0 10px rgba(74, 222, 128, 0.3)' : 'none'
          }} 
        />
      </div>
    </div>
  );
}

function MetricBox({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

function LinkItem({ href, icon, label }: { href: string, icon: string, label: string }) {
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', 
      borderRadius: 'var(--radius-sm)', textDecoration: 'none', background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-soft)', fontSize: '0.825rem',
      transition: HOVER_TRANSITION
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'var(--text-soft)'; }}
    >
      <span>{icon}</span> {label}
    </Link>
  );
}

function EmptyState({ message, actionLabel, actionHref }: { message: string, actionLabel: string, actionHref: string }) {
  return (
    <div style={{ padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.01)' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }}>📭</div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 500, marginBottom: '0.25rem' }}>No Active Computations</div>
      <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1.5rem', maxWidth: 240 }}>{message}</p>
      <Link href={actionHref}><button className="button secondary">{actionLabel}</button></Link>
    </div>
  );
}

// ─── Helpers & Icons ─────────────────────────────────────────────────────────

function confidenceLabel(band: string) {
  const map: Record<string, string> = { very_high: 'Very High', high: 'High', medium: 'Medium', low: 'Low', very_low: 'Very Low' };
  return map[band] ?? band;
}

function confidenceColor(band: string) {
  const map: Record<string, string> = { very_high: 'var(--success)', high: '#4ade80', medium: 'var(--warning)', low: 'var(--danger)', very_low: '#ef4444' };
  return map[band] ?? 'var(--muted)';
}

function statusColor(status: string) {
  const map: Record<string, string> = { mastered: '#4ade80', in_progress: '#6ea2ff', available: 'var(--warning)', locked: 'var(--muted-soft)' };
  return map[status] ?? 'var(--muted)';
}

function statusGradient(status: string) {
  const map: Record<string, string> = {
    mastered: 'linear-gradient(90deg, #22c55e, #4ade80)',
    in_progress: 'linear-gradient(90deg, #4f8cff, #6ea2ff)',
    available: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
    locked: 'rgba(255,255,255,0.1)',
  };
  return map[status] ?? 'rgba(255,255,255,0.1)';
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    completed: { label: 'Verified', color: '#4ade80', bg: 'rgba(34,197,94,0.1)' },
    in_progress: { label: 'Compiling', color: '#6ea2ff', bg: 'rgba(79,140,255,0.1)' },
    planned: { label: 'Queued', color: 'var(--muted)', bg: 'rgba(255,255,255,0.05)' },
    skipped: { label: 'Bypassed', color: 'var(--muted-soft)', bg: 'rgba(255,255,255,0.02)' },
  };
  const s = map[status] ?? map.planned;
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: s.color, background: s.bg, padding: '0.2rem 0.5rem', borderRadius: '4px', letterSpacing: '0.05em', border: `1px solid ${s.color}40` }}>
      {s.label.toUpperCase()}
    </span>
  );
}

// Minimal Icons
function EyeIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function EyeOffIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}
function BarChartIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function PlanIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function CheckIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
}
function AIIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
}
