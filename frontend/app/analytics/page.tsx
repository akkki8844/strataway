'use client';

import React, { useState } from 'react';
import { useAnalyticsStore } from '../../store/analyticsStore';
import { useRouteStore } from '../../store/routeStore';
import { RiskFactor } from '../../../types/analytics';

const RISK_COLOR: Record<string, string> = {
  very_low: '#4ade80', low: '#86efac', medium: '#f59e0b', high: '#f87171', very_high: '#ef4444',
};
const CONF_COLOR: Record<string, string> = {
  very_high: '#22c55e', high: '#4ade80', medium: '#60a5fa', low: '#f59e0b', very_low: '#f87171',
};
const BAND_VALUE: Record<string, number> = {
  very_high: 90, high: 72, medium: 55, low: 35, very_low: 18,
};

export default function AnalyticsPage() {
  const { snapshot, activeRouteId, setActiveAnalyticsRoute, getRouteAnalytics, getRiskBreakdown, getProbabilityTimeline, getWeeklyLoads } = useAnalyticsStore();
  const { routes } = useRouteStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'risk' | 'load' | 'confidence'>('overview');

  const analytics = getRouteAnalytics(activeRouteId);
  const riskBreakdown = getRiskBreakdown(activeRouteId);
  const probTimeline = getProbabilityTimeline(activeRouteId);
  const weeklyLoads = getWeeklyLoads(activeRouteId);

  return (
    <div className="slide-up">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Probability timelines, risk breakdown, and weekly load — all deterministic</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Route:</span>
          {routes.map(r => (
            <button key={r.meta.id}
              onClick={() => setActiveAnalyticsRoute(r.meta.id)}
              className={`button ${activeRouteId === r.meta.id ? '' : 'secondary'}`}
              style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
              <span className={`route-chip ${r.meta.profile}`} style={{ marginRight: '0.3rem' }}>{r.meta.profile}</span>
              {r.meta.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI summary strip ─────────────────────────────────────────────── */}
      {analytics && (
        <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-label">Estimated Weeks</div>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>{analytics.estimatedWeeks}<span className="stat-unit">w</span></div>
            <div className="stat-trend neutral">· Total duration</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Effort</div>
            <div className="stat-value" style={{ color: '#c084fc' }}>{analytics.totalEffortHours}<span className="stat-unit">h</span></div>
            <div className="stat-trend neutral">· {Math.round(analytics.totalEffortHours / analytics.estimatedWeeks * 10) / 10}h avg/week</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Overall Risk</div>
            <div className="stat-value" style={{ color: RISK_COLOR[analytics.risk], fontSize: '1.3rem' }}>
              {analytics.risk.replace('_', ' ')}
            </div>
            <div className="stat-trend neutral">· {analytics.sustainability}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Confidence</div>
            <div className="stat-value" style={{ color: CONF_COLOR[analytics.currentConfidence], fontSize: '1.3rem' }}>
              {analytics.currentConfidence.replace('_', ' ')}
            </div>
            <div className="stat-trend neutral">· At current pace</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Cost</div>
            <div className="stat-value" style={{ color: analytics.totalCost === 0 ? 'var(--success)' : 'var(--warning)' }}>
              {analytics.totalCost === 0 ? 'Free' : `$${analytics.totalCost}`}
            </div>
            <div className="stat-trend neutral">· Resources</div>
          </div>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        {(['overview', 'risk', 'load', 'confidence'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.65rem 1rem',
              fontSize: '0.875rem', fontWeight: 500,
              color: activeTab === tab ? 'var(--primary)' : 'var(--muted)',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all var(--dur-fast) var(--ease-standard)',
              textTransform: 'capitalize',
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="scale-in">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Route comparison radar */}
            <div className="card outline">
              <div className="section-title" style={{ marginBottom: '1rem' }}>Route Comparison</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {snapshot.routes.map(ra => (
                  <div key={ra.routeId} style={{
                    padding: '0.75rem', borderRadius: 'var(--radius-md)',
                    border: ra.routeId === activeRouteId ? '1px solid rgba(79,140,255,0.4)' : '1px solid var(--border)',
                    background: ra.routeId === activeRouteId ? 'rgba(79,140,255,0.06)' : 'transparent',
                    cursor: 'pointer',
                  }}
                    onClick={() => setActiveAnalyticsRoute(ra.routeId)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`route-chip ${ra.pace}`}>{ra.pace}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                          {routes.find(r => r.meta.id === ra.routeId)?.meta.label}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: CONF_COLOR[ra.currentConfidence], fontWeight: 600 }}>
                        {ra.currentConfidence.replace('_', ' ')} confidence
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {[
                        { label: 'Risk', value: ra.risk.replace('_', ' '), color: RISK_COLOR[ra.risk] },
                        { label: 'Sust.', value: ra.sustainability, color: ra.sustainability === 'stable' ? '#4ade80' : ra.sustainability === 'stretch' ? '#f59e0b' : '#f87171' },
                        { label: 'Weeks', value: `${ra.estimatedWeeks}w`, color: 'var(--text)' },
                        { label: 'Hours', value: `${ra.totalEffortHours}h`, color: 'var(--text)' },
                      ].map(m => (
                        <div key={m.label}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>{m.label}</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: m.color }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence legend */}
            <div className="card outline">
              <div className="section-title" style={{ marginBottom: '1rem' }}>Confidence Explained</div>
              <p style={{ fontSize: '0.825rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
                Confidence bands are <em>relative</em>, not absolute probabilities. They reflect how aligned
                the route is with your current constraints, mastery state, and pace.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {[
                  { band: 'very_high', desc: 'All constraints favorable. Low workload variance. Consistent history.' },
                  { band: 'high', desc: 'Minor gaps exist but route is well-matched to capacity.' },
                  { band: 'medium', desc: 'Some prerequisite gaps or moderate overload risk.' },
                  { band: 'low', desc: 'Significant mismatch between route demands and current state.' },
                  { band: 'very_low', desc: 'Route is likely infeasible without major constraint changes.' },
                ].map(item => (
                  <div key={item.band} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{
                      flexShrink: 0, padding: '0.2rem 0.6rem', borderRadius: 99, fontSize: '0.7rem',
                      fontWeight: 700, color: CONF_COLOR[item.band], background: `${CONF_COLOR[item.band]}18`,
                    }}>{item.band.replace('_', ' ')}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'risk' && riskBreakdown && (
        <div className="scale-in">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
            <div className="card outline">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div className="section-title">Risk Breakdown</div>
                <span style={{
                  padding: '0.3rem 0.75rem', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700,
                  color: RISK_COLOR[riskBreakdown.overall], background: `${RISK_COLOR[riskBreakdown.overall]}18`,
                }}>
                  Overall: {riskBreakdown.overall.replace('_', ' ')}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {riskBreakdown.factors.map(factor => (
                  <RiskFactorRow key={factor.id} factor={factor} />
                ))}
              </div>
            </div>

            <div className="card outline">
              <div className="section-title" style={{ marginBottom: '0.75rem' }}>Risk Weight Distribution</div>
              <RiskWeightChart factors={riskBreakdown.factors} />
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Domain breakdown:</div>
                {['time', 'prerequisites', 'consistency', 'difficulty', 'external'].map(domain => {
                  const domainFactors = riskBreakdown.factors.filter(f => f.domain === domain);
                  const totalWeight = domainFactors.reduce((acc, f) => acc + f.weight, 0);
                  if (totalWeight === 0) return null;
                  return (
                    <div key={domain} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'capitalize' }}>{domain}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
                        {Math.round(totalWeight * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'load' && (
        <div className="scale-in">
          <div className="card outline">
            <div className="section-header">
              <div className="section-title">Weekly Load Snapshot</div>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--primary)', display: 'inline-block' }} /> Planned
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--danger)', display: 'inline-block' }} /> Overload
                </span>
              </div>
            </div>
            <LoadBarChart loads={weeklyLoads} />
          </div>
        </div>
      )}

      {activeTab === 'confidence' && probTimeline && (
        <div className="scale-in">
          <div className="card outline">
            <div className="section-header">
              <div className="section-title">Probability Timeline</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Confidence band over route lifetime</div>
            </div>
            <ConfidenceTimelineChart timeline={probTimeline.points} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function RiskFactorRow({ factor }: { factor: RiskFactor }) {
  const color = RISK_COLOR[factor.level] ?? 'var(--muted)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
        <div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{factor.label}</span>
          <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.4rem', borderRadius: 99 }}>
            {factor.domain}
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{factor.level.replace('_', ' ')}</span>
      </div>
      {factor.description && (
        <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '0 0 0.35rem', lineHeight: 1.5 }}>
          {factor.description}
        </p>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
          <div style={{ height: '100%', width: `${factor.weight * 100}%`, background: color, borderRadius: 99, transition: 'width 0.8s var(--ease-out)' }} />
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--muted)', minWidth: 30, textAlign: 'right' }}>
          {Math.round(factor.weight * 100)}%
        </span>
      </div>
    </div>
  );
}

function RiskWeightChart({ factors }: { factors: RiskFactor[] }) {
  const size = 140;
  const cx = size / 2, cy = size / 2, r = 52;
  let startAngle = -Math.PI / 2;
  const total = factors.reduce((a, f) => a + f.weight, 0);
  const colors = ['#4f8cff', '#c084fc', '#f59e0b', '#f87171', '#34d399'];

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width={size} height={size}>
        {factors.map((f, i) => {
          const angle = (f.weight / total) * 2 * Math.PI;
          const endAngle = startAngle + angle;
          const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
          const largeArc = angle > Math.PI ? 1 : 0;
          const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
          startAngle = endAngle;
          return <path key={f.id} d={d} fill={colors[i % colors.length]} opacity={0.85} />;
        })}
        <circle cx={cx} cy={cy} r={28} fill="var(--bg-soft)" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fill="var(--muted)" fontFamily="Inter">Risk</text>
      </svg>
    </div>
  );
}

function LoadBarChart({ loads }: { loads: { weekIndex: number; plannedHours: number; maxHours: number; overload: boolean }[] }) {
  const maxVal = Math.max(...loads.map(l => l.plannedHours), 15);
  const H = 180, barW = 14, gap = 3;
  const totalW = loads.length * (barW + gap);

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
      <svg width={totalW} height={H + 40} style={{ display: 'block' }}>
        {/* Max hours line */}
        <line x1={0} x2={totalW} y1={H - (15 / maxVal) * H} y2={H - (15 / maxVal) * H}
          stroke="rgba(239,68,68,0.4)" strokeDasharray="5,4" strokeWidth={1} />
        <text x={2} y={H - (15 / maxVal) * H - 4} fontSize={8} fill="rgba(239,68,68,0.6)">max</text>

        {loads.map((l, i) => {
          const barH = Math.max(2, (l.plannedHours / maxVal) * H);
          const x = i * (barW + gap);
          const y = H - barH;
          const fill = l.overload ? 'var(--danger)' : l.plannedHours > 12 ? '#f59e0b' : 'var(--primary)';
          return (
            <g key={l.weekIndex}>
              <rect x={x} y={y} width={barW} height={barH} rx={2} fill={fill} opacity={0.85} />
              {(i % 4 === 0) && (
                <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize={8} fill="var(--muted-soft)">
                  W{l.weekIndex + 1}
                </text>
              )}
              <title>Week {l.weekIndex + 1}: {l.plannedHours}h{l.overload ? ' (overload)' : ''}</title>
            </g>
          );
        })}

        {/* Burnout risk overlay */}
        {loads.filter(l => l.overload).map(l => {
          const x = l.weekIndex * (barW + gap);
          return (
            <rect key={`ov-${l.weekIndex}`} x={x} y={0} width={barW} height={H}
              rx={2} fill="rgba(239,68,68,0.08)" />
          );
        })}
      </svg>
    </div>
  );
}

function ConfidenceTimelineChart({ timeline }: { timeline: { stepIndex: number; band: string }[] }) {
  const H = 160, padX = 32;
  const W = Math.max(600, timeline.length * 14);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={W + padX * 2} height={H + 40} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="confGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(79,140,255,0.25)" />
            <stop offset="100%" stopColor="rgba(79,140,255,0)" />
          </linearGradient>
        </defs>

        {/* Y-axis labels */}
        {['very_high', 'high', 'medium', 'low', 'very_low'].map((b, i) => {
          const y = (i / 4) * H;
          return (
            <g key={b}>
              <line x1={padX} x2={W + padX} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
              <text x={padX - 4} y={y + 4} textAnchor="end" fontSize={8} fill="var(--muted-soft)">
                {b.replace('_', ' ')}
              </text>
            </g>
          );
        })}

        {/* Line + area */}
        {(() => {
          const pts = timeline.map((p, i) => {
            const x = padX + (i / Math.max(timeline.length - 1, 1)) * W;
            const v = BAND_VALUE[p.band] ?? 50;
            const y = H - (v / 100) * H;
            return { x, y, band: p.band };
          });
          const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
          const area = `M${pts[0].x},${H} ${polyline} L${pts[pts.length - 1].x},${H} Z`;

          return (
            <>
              <path d={area} fill="url(#confGrad)" />
              <polyline points={polyline} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" />
              {pts.filter((_, i) => i % 5 === 0).map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill={CONF_COLOR[p.band]} />
              ))}
            </>
          );
        })()}

        {/* X-axis */}
        {timeline.filter((_, i) => i % 6 === 0).map((p, i) => {
          const x = padX + (p.stepIndex / Math.max(timeline.length - 1, 1)) * W;
          return (
            <text key={i} x={x} y={H + 16} textAnchor="middle" fontSize={8} fill="var(--muted-soft)">
              Wk{p.stepIndex + 1}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
