'use client';

import React, { useState } from 'react';
import { useRouteStore } from '../../store/routeStore';
import { useAnalyticsStore } from '../../store/analyticsStore';
import { RoutePlan } from '../../../types/route';
import { RouteAnalyticsSummary } from '../../../types/analytics';
import Link from 'next/link';

type SortKey = 'weeks' | 'hours' | 'risk' | 'cost' | 'confidence';

const RISK_ORDER: Record<string, number> = {
  very_low: 0, low: 1, medium: 2, high: 3, very_high: 4,
};
const CONF_ORDER: Record<string, number> = {
  very_high: 0, high: 1, medium: 2, low: 3, very_low: 4,
};

export default function RoutesPage() {
  const { routes, activeRouteId, setActiveRoute, pinnedRouteIds, pinRoute, unpinRoute } = useRouteStore();
  const { getRouteAnalytics } = useAnalyticsStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('weeks');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const analytics = routes.map(r => getRouteAnalytics(r.meta.id)).filter(Boolean) as RouteAnalyticsSummary[];

  const sorted = [...routes].sort((a, b) => {
    const aa = analytics.find(x => x.routeId === a.meta.id);
    const ba = analytics.find(x => x.routeId === b.meta.id);
    switch (sortKey) {
      case 'weeks': return a.weeks - b.weeks;
      case 'hours': return a.cost.totalHours - b.cost.totalHours;
      case 'risk': return (RISK_ORDER[aa?.risk ?? 'medium'] ?? 2) - (RISK_ORDER[ba?.risk ?? 'medium'] ?? 2);
      case 'cost': return a.cost.totalCost - b.cost.totalCost;
      case 'confidence': return (CONF_ORDER[aa?.currentConfidence ?? 'medium'] ?? 2) - (CONF_ORDER[ba?.currentConfidence ?? 'medium'] ?? 2);
      default: return 0;
    }
  });

  const selectedRoute = selectedId ? routes.find(r => r.meta.id === selectedId) : null;
  const selectedAnalytics = selectedId ? analytics.find(a => a.routeId === selectedId) : null;

  return (
    <div className="slide-up">
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Routes</h1>
          <p className="page-subtitle">4 generated paths to your goal · Compare trade-offs and choose your strategy</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Sort:</span>
          {(['weeks', 'hours', 'risk', 'cost', 'confidence'] as SortKey[]).map(k => (
            <button key={k} onClick={() => setSortKey(k)}
              className={`button ${sortKey === k ? '' : 'secondary'}`}
              style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* ── Comparison Matrix ───────────────────────────────────────────── */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Comparison Matrix</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            Click a route to inspect · {activeRouteId && <span style={{ color: 'var(--primary)' }}>Active: {routes.find(r => r.meta.id === activeRouteId)?.meta.label}</span>}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Route', 'Profile', 'Duration', 'Total Hours', 'Risk', 'Sustainability', 'Confidence', 'Cost', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(route => {
                const ra = analytics.find(a => a.routeId === route.meta.id);
                const isActive = route.meta.id === activeRouteId;
                const isSelected = route.meta.id === selectedId;
                const isPinned = pinnedRouteIds.includes(route.meta.id);
                const isHovered = route.meta.id === hoveredId;
                return (
                  <tr
                    key={route.meta.id}
                    onClick={() => setSelectedId(isSelected ? null : route.meta.id)}
                    onMouseEnter={() => setHoveredId(route.meta.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: isSelected
                        ? 'rgba(79,140,255,0.08)'
                        : isHovered ? 'rgba(255,255,255,0.02)' : 'transparent',
                      transition: 'background var(--dur-fast) var(--ease-standard)',
                    }}
                  >
                    <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text)', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />}
                        {route.meta.label}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`route-chip ${route.meta.profile}`}>{route.meta.profile}</span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text)' }}>
                      <WeeksBar weeks={route.weeks} maxWeeks={52} />
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text)' }}>
                      <HoursBar hours={route.cost.totalHours} maxHours={130} />
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {ra && <RiskBadge level={ra.risk} />}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {ra && <SustBadge level={ra.sustainability} />}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {ra && <ConfBadge band={ra.currentConfidence} />}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                      {route.cost.totalCost === 0 ? 'Free' : `$${route.cost.totalCost}`}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveRoute(route.meta.id); }}
                          className={`button ${isActive ? 'success' : 'secondary'}`}
                          style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}>
                          {isActive ? '✓ Active' : 'Activate'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); isPinned ? unpinRoute(route.meta.id) : pinRoute(route.meta.id); }}
                          className="button ghost"
                          style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}>
                          {isPinned ? '📌' : '📎'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Route Inspector ────────────────────────────────────────────── */}
      {selectedRoute && selectedAnalytics && (
        <div className="section scale-in">
          <div className="section-header">
            <div>
              <div className="section-title">Inspecting: {selectedRoute.meta.label}</div>
              <div className="section-subtitle">Full breakdown of milestones, tasks and risk</div>
            </div>
            <button onClick={() => setSelectedId(null)} className="button ghost" style={{ fontSize: '0.8rem' }}>✕ Close</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Milestones */}
            <div className="card outline">
              <div className="section-title" style={{ marginBottom: '0.75rem' }}>Milestones</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedRoute.milestones.map((m, i) => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    padding: '0.65rem', borderRadius: 'var(--radius-md)',
                    background: m.isCritical ? 'rgba(79,140,255,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${m.isCritical ? 'rgba(79,140,255,0.2)' : 'var(--border)'}`,
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: m.isCritical ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', fontWeight: 700, color: '#fff',
                    }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{m.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                        Week {m.targetWeekIndex + 1} {m.isCritical && '· Critical path'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trade-off vis */}
            <div className="card outline">
              <div className="section-title" style={{ marginBottom: '1rem' }}>Trade-off Radar</div>
              <TradeoffRadar analytics={selectedAnalytics} />
              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <MetaRow label="Est. Weeks" value={`${selectedRoute.weeks}w`} />
                <MetaRow label="Total Hours" value={`${selectedRoute.cost.totalHours}h`} />
                <MetaRow label="Tasks" value={`${selectedRoute.tasks.length}`} />
                <MetaRow label="Milestones" value={`${selectedRoute.milestones.length}`} />
              </div>
            </div>
          </div>

          {/* Task list */}
          <div className="card outline" style={{ marginTop: '1rem' }}>
            <div className="section-title" style={{ marginBottom: '0.75rem' }}>Scheduled Tasks</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem' }}>
              {selectedRoute.tasks.map(task => (
                <div key={task.id} className="task-block" style={{ cursor: 'default' }}>
                  <div className="task-dot study" />
                  <div style={{ flex: 1 }}>
                    <div className="task-title">{task.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                      Week {task.weekIndex + 1} · {task.skillId?.replace(/_/g, ' ') ?? 'general'}
                    </div>
                  </div>
                  <div className="task-hours">{task.estimatedHours}h</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Explainer strip ───────────────────────────────────────────── */}
      <div className="card outline" style={{
        background: 'linear-gradient(135deg, rgba(79,140,255,0.05), rgba(155,109,255,0.05))',
        border: '1px solid rgba(79,140,255,0.2)',
        padding: '1.25rem 1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
      }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>
            How routes are generated
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--muted)', maxWidth: '600px' }}>
            Routes are derived from your skill graph, constraints (max hours/week, budget, difficulty tolerance) and
            a multi-objective scoring model. No AI black-box — every decision is traceable.
          </p>
        </div>
        <Link href="/explain">
          <button className="button secondary" style={{ flexShrink: 0, fontSize: '0.825rem' }}>
            See Decision Log →
          </button>
        </Link>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function WeeksBar({ weeks, maxWeeks }: { weeks: number; maxWeeks: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, maxWidth: 80 }}>
        <div style={{ height: '100%', width: `${(weeks / maxWeeks) * 100}%`, background: 'var(--primary)', borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 500, minWidth: 28 }}>{weeks}w</span>
    </div>
  );
}

function HoursBar({ hours, maxHours }: { hours: number; maxHours: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, maxWidth: 80 }}>
        <div style={{ height: '100%', width: `${(hours / maxHours) * 100}%`, background: '#c084fc', borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 500, minWidth: 28 }}>{hours}h</span>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    very_low: '#4ade80', low: '#86efac', medium: '#f59e0b', high: '#f87171', very_high: '#ef4444',
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      fontSize: '0.75rem', fontWeight: 600, color: colors[level] ?? 'var(--muted)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[level] ?? 'var(--muted)' }} />
      {level.replace('_', ' ')}
    </span>
  );
}

function SustBadge({ level }: { level: string }) {
  const colors: Record<string, string> = { fragile: '#f87171', stable: '#4ade80', stretch: '#f59e0b' };
  return (
    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: colors[level] ?? 'var(--muted)' }}>
      {level}
    </span>
  );
}

function ConfBadge({ band }: { band: string }) {
  const colors: Record<string, string> = {
    very_high: '#4ade80', high: '#86efac', medium: '#60a5fa', low: '#f59e0b', very_low: '#f87171',
  };
  return (
    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: colors[band] ?? 'var(--muted)' }}>
      {band.replace('_', ' ')}
    </span>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '0.4rem 0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginBottom: '0.125rem' }}>{label}</div>
      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{value}</div>
    </div>
  );
}

function TradeoffRadar({ analytics }: { analytics: RouteAnalyticsSummary }) {
  const size = 160;
  const cx = size / 2, cy = size / 2, r = 60;

  const dimensions = [
    { label: 'Speed', value: analytics.pace === 'fast' ? 1 : analytics.pace === 'balanced' ? 0.65 : analytics.pace === 'safe' ? 0.35 : 0.55 },
    { label: 'Safety', value: analytics.risk === 'very_low' ? 1 : analytics.risk === 'low' ? 0.8 : analytics.risk === 'medium' ? 0.55 : 0.25 },
    { label: 'Effort', value: analytics.totalEffortHours > 120 ? 0.3 : analytics.totalEffortHours > 100 ? 0.6 : 0.85 },
    { label: 'Confidence', value: analytics.currentConfidence === 'very_high' ? 1 : analytics.currentConfidence === 'high' ? 0.8 : 0.5 },
    { label: 'Cost', value: analytics.totalCost === 0 ? 1 : analytics.totalCost < 100 ? 0.75 : 0.4 },
  ];

  const n = dimensions.length;
  const angleStep = (2 * Math.PI) / n;

  const points = dimensions.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    return { x: cx + r * d.value * Math.cos(angle), y: cy + r * d.value * Math.sin(angle) };
  });

  const polygon = points.map(p => `${p.x},${p.y}`).join(' ');

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1];

  const axisPoints = dimensions.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        {/* Grid rings */}
        {rings.map(scale => (
          <polygon key={scale}
            points={axisPoints.map(p => {
              const dx = (p.x - cx) * scale, dy = (p.y - cy) * scale;
              return `${cx + dx},${cy + dy}`;
            }).join(' ')}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
        ))}
        {/* Axes */}
        {axisPoints.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y}
            stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
        ))}
        {/* Data polygon */}
        <polygon points={polygon}
          fill="rgba(79,140,255,0.18)" stroke="rgba(79,140,255,0.8)" strokeWidth={1.5} />
        {/* Labels */}
        {dimensions.map((d, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const lx = cx + (r + 20) * Math.cos(angle);
          const ly = cy + (r + 20) * Math.sin(angle);
          return (
            <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fontSize="9" fill="var(--muted)" fontWeight="500">
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
