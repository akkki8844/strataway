'use client';

import React, { useEffect, useState } from 'react';
import { useRouteStore } from '../../store/routeStore';
import { useTimelineStore } from '../../store/timelineStore';
import { useAnalyticsStore } from '../../store/analyticsStore';
import { useSkillStore } from '../../store/skillStore';
import Link from 'next/link';

export default function DashboardPage() {
  const { routes, activeRouteId } = useRouteStore();
  const { tasks, currentWeek } = useTimelineStore();
  const { getRouteAnalytics, getOverloadWeeks, getWeeklyLoads } = useAnalyticsStore();
  const { mastery } = useSkillStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const activeRoute = routes.find(r => r.meta.id === activeRouteId);
  const analytics = getRouteAnalytics(activeRouteId ?? 'route_balanced');
  const completedTasks = tasks.filter(t => t.execution.status === 'completed');
  const inProgressTasks = tasks.filter(t => t.execution.status === 'in_progress');
  const currentWeekTasks = tasks.filter(t => t.core.weekIndex === currentWeek);
  const masteredSkills = mastery.filter(m => m.status === 'mastered');
  const overloadWeeks = getOverloadWeeks(activeRouteId ?? 'route_balanced');
  const loads = getWeeklyLoads(activeRouteId ?? 'route_balanced');
  const weekLoad = loads.find(l => l.weekIndex === currentWeek);
  const completionPct = tasks.length > 0
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  if (!mounted) return null;

  return (
    <div className="slide-up">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{activeRoute?.meta.label ?? 'No route selected'}</span>
            {activeRoute && ` · Week ${currentWeek} of ${activeRoute.weeks} · ${activeRoute.weeks - currentWeek} weeks remaining`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/routes">
            <button className="button secondary" style={{ fontSize: '0.825rem' }}>
              <SwitchIcon /> Switch Route
            </button>
          </Link>
          <Link href="/timeline">
            <button className="button" style={{ fontSize: '0.825rem' }}>
              <PlanIcon /> View This Week
            </button>
          </Link>
        </div>
      </div>

      {/* ── KPI Stats ─────────────────────────────────────────────────── */}
      <div className="stat-grid">
        <StatCard
          label="Week Progress"
          value={`${currentWeek}`}
          unit={`/ ${activeRoute?.weeks ?? '—'}`}
          trend={{ dir: 'up', text: 'On schedule' }}
          color="var(--primary)"
        />
        <StatCard
          label="Tasks Complete"
          value={`${completedTasks.length}`}
          unit={`/ ${tasks.length}`}
          trend={{ dir: 'up', text: `${completionPct}% done` }}
          color="var(--success)"
        />
        <StatCard
          label="Skills Mastered"
          value={`${masteredSkills.length}`}
          unit={`/ ${mastery.length}`}
          trend={{ dir: 'neutral', text: `${mastery.filter(m => m.status === 'in_progress').length} in progress` }}
          color="#c084fc"
        />
        <StatCard
          label="This Week Load"
          value={`${weekLoad?.plannedHours ?? '—'}`}
          unit="h"
          trend={{
            dir: weekLoad?.overload ? 'down' : 'up',
            text: weekLoad?.overload ? 'Overloaded' : `of ${weekLoad?.maxHours ?? '—'}h max`,
          }}
          color={weekLoad?.overload ? 'var(--danger)' : 'var(--warning)'}
        />
        <StatCard
          label="Confidence"
          value={analytics ? confidenceLabel(analytics.currentConfidence) : '—'}
          unit=""
          trend={{ dir: 'neutral', text: `Risk: ${analytics?.risk ?? '—'}` }}
          color={analytics ? confidenceColor(analytics.currentConfidence) : 'var(--muted)'}
        />
        <StatCard
          label="Est. Finish"
          value={activeRoute ? `Wk ${activeRoute.weeks}` : '—'}
          unit=""
          trend={{ dir: 'neutral', text: `~${activeRoute ? Math.round((activeRoute.weeks - currentWeek) * 1.5) : 0} months left` }}
          color="var(--info)"
        />
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Focus: This Week */}
          <div className="card outline">
            <div className="section-header" style={{ marginBottom: '1rem' }}>
              <div>
                <div className="section-title">🎯 This Week's Focus</div>
                <div className="section-subtitle">Week {currentWeek} — {currentWeekTasks.length} tasks scheduled</div>
              </div>
              <Link href="/timeline">
                <button className="button ghost" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
                  Full planner →
                </button>
              </Link>
            </div>

            {currentWeekTasks.length === 0 ? (
              <div className="empty-state">No tasks scheduled for this week</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {currentWeekTasks.map(task => (
                  <div key={task.core.id} className={`task-block ${task.execution.status}`}>
                    <div className={`task-dot ${task.core.kind}`} />
                    <div style={{ flex: 1 }}>
                      <div className="task-title">{task.core.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                        {task.core.kind} · linked to{' '}
                        <span style={{ color: 'var(--primary-soft)' }}>
                          {task.links.skillId?.replace(/_/g, ' ') ?? 'general'}
                        </span>
                      </div>
                    </div>
                    <div className="task-hours">{task.core.estimatedHours}h</div>
                    <StatusPill status={task.execution.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Load Sparkline */}
          <div className="card outline">
            <div className="section-header">
              <div>
                <div className="section-title">Weekly Load Overview</div>
                <div className="section-subtitle">Hours planned per week · max {weekLoad?.maxHours ?? 15}h</div>
              </div>
              <Link href="/analytics">
                <button className="button ghost" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
                  Full analytics →
                </button>
              </Link>
            </div>
            <LoadSparkline loads={loads.slice(0, 20)} currentWeek={currentWeek} />
          </div>

          {/* Route Comparison Mini */}
          <div className="card outline">
            <div className="section-header">
              <div className="section-title">Route Comparison</div>
              <Link href="/routes">
                <button className="button ghost" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
                  Full matrix →
                </button>
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {routes.map(route => {
                const ra = getRouteAnalytics(route.meta.id);
                const isActive = route.meta.id === activeRouteId;
                return (
                  <div
                    key={route.meta.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: isActive
                        ? '1px solid rgba(79,140,255,0.4)'
                        : '1px solid var(--border)',
                      background: isActive ? 'rgba(79,140,255,0.06)' : 'transparent',
                    }}
                  >
                    <span className={`route-chip ${route.meta.profile}`}>{route.meta.profile}</span>
                    <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>
                      {route.meta.label}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {route.weeks}w
                    </span>
                    {ra && (
                      <span className={`risk-${ra.risk}`} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {ra.risk.replace('_', ' ')} risk
                      </span>
                    )}
                    {isActive && (
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 600, background: 'rgba(79,140,255,0.2)',
                        color: 'var(--primary)', padding: '0.1rem 0.5rem', borderRadius: '99px',
                      }}>ACTIVE</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Progress Ring */}
          <div className="card outline" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div className="section-title" style={{ marginBottom: '1.25rem' }}>Overall Progress</div>
            <ProgressRingChart pct={completionPct} size={140} strokeWidth={10} />
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
              {completedTasks.length} completed · {inProgressTasks.length} active · {tasks.filter(t => t.execution.status === 'planned').length} planned
            </div>
          </div>

          {/* Skill Mastery */}
          <div className="card outline">
            <div className="section-header">
              <div className="section-title">Skill Mastery</div>
              <Link href="/skills">
                <button className="button ghost" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
                  Graph →
                </button>
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {mastery.slice(0, 8).map(m => {
                const skillName = m.skillId.replace(/_/g, ' ');
                return (
                  <div key={m.skillId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-soft)', textTransform: 'capitalize' }}>
                        {skillName}
                      </span>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 600, color: statusColor(m.status)
                      }}>
                        {m.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="progress">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${m.progress}%`,
                          background: statusGradient(m.status),
                          transition: 'width 0.8s var(--ease-out)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk Alerts */}
          {overloadWeeks.length > 0 && (
            <div className="card outline" style={{ border: '1px solid rgba(239,68,68,0.25)' }}>
              <div className="section-title" style={{ marginBottom: '0.75rem', color: 'var(--danger)' }}>
                ⚠ Overload Detected
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                Weeks {overloadWeeks.slice(0, 3).join(', ')} exceed your max hours cap.
                Consider rescheduling or adjusting your weekly capacity.
              </p>
              <Link href="/timeline">
                <button className="button danger" style={{ marginTop: '0.75rem', fontSize: '0.8rem', width: '100%' }}>
                  Fix in Timeline →
                </button>
              </Link>
            </div>
          )}

          {/* Quick Links */}
          <div className="card flat" style={{ border: '1px solid var(--border)', padding: '1rem' }}>
            <div className="section-title" style={{ marginBottom: '0.75rem' }}>Quick Access</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {[
                { href: '/skills', label: 'View Skill Graph', icon: '🔗' },
                { href: '/analytics', label: 'Explore Analytics', icon: '📊' },
                { href: '/explain', label: 'Decision Log', icon: '📋' },
                { href: '/settings', label: 'Edit Constraints', icon: '⚙️' },
              ].map(link => (
                <Link key={link.href} href={link.href} style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.5rem 0.5rem', borderRadius: 'var(--radius-sm)',
                  color: 'var(--muted)', fontSize: '0.825rem', fontWeight: 500,
                  transition: 'all var(--dur-fast) var(--ease-standard)',
                  textDecoration: 'none',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; }}
                >
                  <span>{link.icon}</span> {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, unit, trend, color }: {
  label: string; value: string; unit: string;
  trend: { dir: 'up' | 'down' | 'neutral'; text: string };
  color: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>
        {value}<span className="stat-unit">{unit}</span>
      </div>
      <div className={`stat-trend ${trend.dir}`}>
        {trend.dir === 'up' ? '↑' : trend.dir === 'down' ? '↓' : '·'} {trend.text}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    completed: { label: 'Done', color: '#4ade80', bg: 'rgba(34,197,94,0.15)' },
    in_progress: { label: 'Active', color: '#6ea2ff', bg: 'rgba(79,140,255,0.15)' },
    planned: { label: 'Planned', color: 'var(--muted)', bg: 'rgba(255,255,255,0.06)' },
    skipped: { label: 'Skipped', color: 'var(--muted)', bg: 'rgba(255,255,255,0.06)' },
  };
  const s = map[status] ?? map.planned;
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 600, color: s.color,
      background: s.bg, padding: '0.15rem 0.5rem', borderRadius: '99px',
    }}>{s.label}</span>
  );
}

function LoadSparkline({ loads, currentWeek }: { loads: { weekIndex: number; plannedHours: number; maxHours: number; overload: boolean }[]; currentWeek: number }) {
  const max = Math.max(...loads.map(l => l.plannedHours), 1);
  const H = 64;
  const barW = 12;
  const gap = 4;
  const totalW = loads.length * (barW + gap);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={totalW} height={H + 24} style={{ display: 'block' }}>
        {loads.map((l, i) => {
          const barH = Math.max(2, (l.plannedHours / max) * H);
          const x = i * (barW + gap);
          const y = H - barH;
          const isCurrent = l.weekIndex === currentWeek;
          const color = l.overload ? 'var(--danger)' : isCurrent ? 'var(--primary)' : 'rgba(79,140,255,0.35)';
          return (
            <g key={l.weekIndex}>
              <rect x={x} y={y} width={barW} height={barH} rx={2} fill={color} />
              {isCurrent && (
                <rect x={x} y={0} width={barW} height={H} rx={2} fill="rgba(79,140,255,0.08)" />
              )}
              {(i % 5 === 0) && (
                <text x={x + barW / 2} y={H + 16} textAnchor="middle"
                  fontSize="9" fill="var(--muted-soft)">
                  W{l.weekIndex + 1}
                </text>
              )}
            </g>
          );
        })}
        {/* Max line */}
        <line x1={0} x2={totalW} y1={H - (15 / max) * H} y2={H - (15 / max) * H}
          stroke="rgba(239,68,68,0.3)" strokeDasharray="4,3" strokeWidth={1} />
      </svg>
    </div>
  );
}

function ProgressRingChart({ pct, size, strokeWidth }: { pct: number; size: number; strokeWidth: number }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="url(#ringGrad)" strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s var(--ease-out)' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4f8cff" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.04em' }}>
          {pct}%
        </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '0.1rem' }}>done</span>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function confidenceLabel(band: string) {
  const map: Record<string, string> = {
    very_high: 'Very High', high: 'High', medium: 'Medium', low: 'Low', very_low: 'Very Low',
  };
  return map[band] ?? band;
}

function confidenceColor(band: string) {
  const map: Record<string, string> = {
    very_high: 'var(--success)', high: '#4ade80', medium: 'var(--warning)',
    low: 'var(--danger)', very_low: '#ef4444',
  };
  return map[band] ?? 'var(--muted)';
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    mastered: '#4ade80', in_progress: '#6ea2ff', available: 'var(--warning)',
    locked: 'var(--muted-soft)',
  };
  return map[status] ?? 'var(--muted)';
}

function statusGradient(status: string) {
  const map: Record<string, string> = {
    mastered: 'linear-gradient(90deg,#22c55e,#4ade80)',
    in_progress: 'linear-gradient(90deg,#4f8cff,#6ea2ff)',
    available: 'linear-gradient(90deg,#f59e0b,#fbbf24)',
    locked: 'rgba(255,255,255,0.1)',
  };
  return map[status] ?? 'rgba(255,255,255,0.1)';
}

function SwitchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ marginRight: '0.25rem' }}>
      <path d="M4 6h12M4 10h8M4 14h5" strokeLinecap="round" />
    </svg>
  );
}

function PlanIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ marginRight: '0.25rem' }}>
      <rect x="3" y="4" width="14" height="14" rx="2" />
      <line x1="3" y1="8" x2="17" y2="8" />
      <line x1="7" y1="2" x2="7" y2="6" strokeLinecap="round" />
      <line x1="13" y1="2" x2="13" y2="6" strokeLinecap="round" />
    </svg>
  );
}
