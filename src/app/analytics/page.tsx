'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAnalyticsStore } from '../../store/analyticsStore';
import { useRouteStore } from '../../store/routeStore';
import { useTimelineStore } from '../../store/timelineStore';
import { RiskFactor, RouteAnalyticsSummary } from '../../../types/analytics';
import Link from 'next/link';

// ─── Constants & Types ───────────────────────────────────────────────────────

const RISK_COLOR: Record<string, string> = {
  very_low: '#4ade80', low: '#86efac', medium: '#f59e0b', high: '#f87171', very_high: '#ef4444',
};
const CONF_COLOR: Record<string, string> = {
  very_high: '#22c55e', high: '#4ade80', medium: '#60a5fa', low: '#f59e0b', very_low: '#f87171',
};
const BAND_VALUE: Record<string, number> = {
  very_high: 95, high: 75, medium: 55, low: 35, very_low: 15,
};

type AnalyticsTab = 'overview' | 'risk' | 'load' | 'confidence' | 'efficiency';

interface AnalyticsPageState {
  mounted: boolean;
  activeTab: AnalyticsTab;
  comparisonMode: boolean;
  compareRouteId: string | null;
}

const TRANSITION_SPRING = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { snapshot, activeRouteId, setActiveAnalyticsRoute, getRouteAnalytics, getRiskBreakdown, getProbabilityTimeline, getWeeklyLoads, getCapacityEfficiencyRating, invalidateCache, triggerDeepSimulation, isSimulating } = useAnalyticsStore();
  const { routes } = useRouteStore();
  const { tasks, maxHoursPerWeek } = useTimelineStore();

  const [state, setState] = useState<AnalyticsPageState>({
    mounted: false,
    activeTab: 'overview',
    comparisonMode: false,
    compareRouteId: null,
  });

  useEffect(() => { setState(s => ({ ...s, mounted: true })); }, []);

  // ─── Core Data Generation ───
  // We pass 'tasks' and 'maxHoursPerWeek' to trigger the dynamic engine calculations
  // built into analyticsStore.ts in the previous step.

  const activeAnalytics = useMemo(() => getRouteAnalytics(activeRouteId, tasks, maxHoursPerWeek), 
    [getRouteAnalytics, activeRouteId, tasks, maxHoursPerWeek, isSimulating]);
    
  const riskBreakdown = useMemo(() => getRiskBreakdown(activeRouteId, tasks, maxHoursPerWeek), 
    [getRiskBreakdown, activeRouteId, tasks, maxHoursPerWeek, isSimulating]);
    
  const probTimeline = useMemo(() => getProbabilityTimeline(activeRouteId, tasks, maxHoursPerWeek), 
    [getProbabilityTimeline, activeRouteId, tasks, maxHoursPerWeek, isSimulating]);
    
  const weeklyLoads = useMemo(() => getWeeklyLoads(activeRouteId, tasks, maxHoursPerWeek), 
    [getWeeklyLoads, activeRouteId, tasks, maxHoursPerWeek, isSimulating]);
    
  const efficiency = useMemo(() => getCapacityEfficiencyRating(activeRouteId, tasks, maxHoursPerWeek), 
    [getCapacityEfficiencyRating, activeRouteId, tasks, maxHoursPerWeek, isSimulating]);

  // Comparative Data (if active)
  const compareAnalytics = useMemo(() => {
    if (!state.compareRouteId) return null;
    return getRouteAnalytics(state.compareRouteId, tasks, maxHoursPerWeek); // Assuming baseline tasks map to alternative routes roughly for prototyping
  }, [getRouteAnalytics, state.compareRouteId, tasks, maxHoursPerWeek, isSimulating]);

  if (!state.mounted) return null;

  return (
    <div className="slide-up" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      
      {/* ─── Global Header ─────────────────────────────────────────────── */}
      <div className="page-header page-header-row" style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title text-gradient" style={{ fontSize: '2.2rem', letterSpacing: '-0.04em' }}>Telemetry & Analytics</h1>
          <p className="page-subtitle" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Deterministic simulation engine monitoring topological risk, capacity efficiency, and probability nodes.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          
          <button className={`button ${state.comparisonMode ? 'primary-gradient' : 'secondary'}`} onClick={() => setState(s => ({ ...s, comparisonMode: !s.comparisonMode, compareRouteId: !s.comparisonMode ? routes.find(r => r.meta.id !== activeRouteId)?.meta.id || null : null }))}>
             <CompareIcon /> Matrix Comparison
          </button>
          
          <button className="button secondary" onClick={() => triggerDeepSimulation()} disabled={isSimulating} style={{ minWidth: 140 }}>
            {isSimulating ? <span className="loading-spinner" style={{ width: 14, height: 14, marginRight: 8 }} /> : <RefreshIcon />}
            {isSimulating ? 'Computing...' : 'Recalibrate Engine'}
          </button>
        </div>
      </div>

      {/* Route Selector Strip */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginRight: '0.5rem' }}>Primary Vector:</span>
        {routes.map(r => (
          <button key={r.meta.id}
            onClick={() => { setActiveAnalyticsRoute(r.meta.id); triggerDeepSimulation(); }}
            className={`button ${activeRouteId === r.meta.id ? 'primary' : 'ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <span className={`route-chip ${r.meta.profile}`} style={{ marginRight: '0.4rem' }}>{r.meta.profile}</span>
            {r.meta.label}
          </button>
        ))}
      </div>

      {/* Comparison Overlay (If active) */}
      {state.comparisonMode && (
        <div className="card glass-card slide-down" style={{ marginBottom: '2rem', border: '1px solid rgba(192, 132, 252, 0.4)', background: 'linear-gradient(135deg, rgba(29,29,31,0.8) 0%, rgba(192,132,252,0.05) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
             <div>
               <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c084fc' }}>Comparative Matrix Analysis Active</h3>
               <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Select an alternate route baseline below to evaluate delta variances against your Primary Vector.</div>
             </div>
             <button className="button ghost" onClick={() => setState(s => ({ ...s, comparisonMode: false, compareRouteId: null }))}>Dismiss</button>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {routes.filter(r => r.meta.id !== activeRouteId).map(r => (
               <button key={r.meta.id} onClick={() => setState(s => ({ ...s, compareRouteId: r.meta.id }))} 
                 className={`button ${state.compareRouteId === r.meta.id ? '' : 'secondary'}`} style={{ fontSize: '0.8rem' }}>
                 Compare vs {r.meta.label}
               </button>
            ))}
          </div>

          {activeAnalytics && compareAnalytics && (
             <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <DeltaStat label="Time Delta" v1={activeAnalytics.estimatedWeeks} v2={compareAnalytics.estimatedWeeks} unit="weeks" invert />
                <DeltaStat label="Load Delta" v1={activeAnalytics.totalEffortHours} v2={compareAnalytics.totalEffortHours} unit="h" invert />
                <DeltaStat label="Cost Delta" v1={activeAnalytics.totalCost} v2={compareAnalytics.totalCost} unit="$" invert />
             </div>
          )}
        </div>
      )}

      {/* ─── KPI Engine Statistics ─────────────────────────────────────── */}
      {activeAnalytics && (
        <div className="stat-grid" style={{ marginBottom: '2rem' }}>
          <TelemetryCard label="Estimated TTF" value={`${activeAnalytics.estimatedWeeks}`} unit="w" trend="Total Time to Finish based on graph." color="var(--primary)" />
          <TelemetryCard label="Compute Load" value={`${activeAnalytics.totalEffortHours}`} unit="h" trend={`~${Math.round(activeAnalytics.totalEffortHours / activeAnalytics.estimatedWeeks * 10) / 10}h average operational limit/week.`} color="#c084fc" />
          <TelemetryCard label="Overall Risk" value={activeAnalytics.risk.replace('_', ' ').toUpperCase()} unit="" trend={`Sustainability profile: ${activeAnalytics.sustainability}`} color={RISK_COLOR[activeAnalytics.risk]} />
          <TelemetryCard label="Confidence Band" value={activeAnalytics.currentConfidence.replace('_', ' ').toUpperCase()} unit="" trend="Probability of successful traversal." color={CONF_COLOR[activeAnalytics.currentConfidence]} />
          <TelemetryCard label="Efficiency Index" value={`${efficiency}`} unit="%" trend="Current payload utilization vs max limits." color={efficiency > 80 ? 'var(--success)' : efficiency > 50 ? 'var(--warning)' : 'var(--danger)'} />
        </div>
      )}

      {/* ─── Intelligence Tabs ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '2rem', background: 'var(--bg-elevated)', padding: '0.35rem', borderRadius: 'var(--radius-md)' }}>
        {(['overview', 'risk', 'load', 'confidence', 'efficiency'] as AnalyticsTab[]).map(tab => (
          <button key={tab} onClick={() => setState(s => ({ ...s, activeTab: tab }))}
            style={{
              flex: 1, background: state.activeTab === tab ? 'var(--primary-soft)' : 'transparent',
              color: state.activeTab === tab ? 'var(--primary)' : 'var(--muted)',
              border: 'none', padding: '0.55rem 1rem', fontSize: '0.85rem', fontWeight: 600,
              borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize'
            }}>
            {tab} Engine
          </button>
        ))}
      </div>

      {/* ─── Tab Environments ──────────────────────────────────────────── */}
      
      {state.activeTab === 'overview' && (
        <div className="scale-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: '2rem' }}>
            
            {/* Primary Analysis Module */}
            <div className="card outline">
              <div className="section-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div className="section-title">System Execution Output</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Live projection data</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {routes.map(ra => {
                  const data = getRouteAnalytics(ra.meta.id, tasks, maxHoursPerWeek);
                  if (!data) return null;
                  const isActive = data.routeId === activeRouteId;
                  
                  return (
                    <div key={data.routeId} 
                      className="hoverable"
                      style={{
                        padding: '1.25rem', borderRadius: 'var(--radius-md)',
                        border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                        background: isActive ? 'rgba(79, 140, 255, 0.05)' : 'var(--bg-elevated)',
                        cursor: 'pointer', transition: TRANSITION_SPRING
                      }}
                      onClick={() => setActiveAnalyticsRoute(data.routeId)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <span className={`route-chip ${ra.meta.profile}`}>{ra.meta.profile}</span>
                          <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)' }}>{ra.meta.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: CONF_COLOR[data.currentConfidence] }} />
                          <span style={{ fontSize: '0.75rem', color: CONF_COLOR[data.currentConfidence], fontWeight: 700, textTransform: 'uppercase' }}>
                            {data.currentConfidence.replace('_', ' ')} Band
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                        <OverviewMiniStat label="System Risk" value={data.risk.replace('_', ' ')} color={RISK_COLOR[data.risk]} />
                        <OverviewMiniStat label="Structure" value={data.sustainability} color={data.sustainability === 'stable' ? '#4ade80' : data.sustainability === 'stretch' ? '#f59e0b' : '#f87171'} />
                        <OverviewMiniStat label="Temporal" value={`${data.estimatedWeeks}W`} color="var(--text)" />
                        <OverviewMiniStat label="Payload" value={`${data.totalEffortHours}H`} color="var(--text)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Explanation Module */}
            <div className="card outline glass-panel" style={{ background: 'linear-gradient(180deg, rgba(79, 140, 255, 0.03) 0%, transparent 100%)' }}>
              <div className="section-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <InfoIcon /> Confidence Matrix Engine
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Confidence bands are dynamically calculated probability mappings. They represent the theoretical chance of success based on current load, timeline efficiency, and topological constraints.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {[
                  { band: 'very_high', desc: 'Optimal. Minimum variance logic.' },
                  { band: 'high', desc: 'Acceptable constraints. High success rate.' },
                  { band: 'medium', desc: 'Moderate risk. Capacity strained.' },
                  { band: 'low', desc: 'Structural failure imminent without adjustment.' },
                  { band: 'very_low', desc: 'System overload. Re-routing required.' },
                ].map(item => (
                  <div key={item.band} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                    <div style={{ width: '4px', height: '18px', borderRadius: '2px', background: CONF_COLOR[item.band] }} />
                    <div style={{ flex: 1 }}>
                       <div style={{ fontSize: '0.7rem', fontWeight: 700, color: CONF_COLOR[item.band], textTransform: 'uppercase', marginBottom: '0.1rem' }}>{item.band.replace('_', ' ')}</div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--muted-soft)' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {state.activeTab === 'risk' && riskBreakdown && (
        <div className="scale-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: '2rem' }}>
            <div className="card outline">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                   <h3 className="section-title" style={{ fontSize: '1.3rem' }}>Deep Risk Telemetry</h3>
                   <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Structural weaknesses across execution timeline.</div>
                </div>
                <div style={{
                  padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: RISK_COLOR[riskBreakdown.overall], background: `${RISK_COLOR[riskBreakdown.overall]}18`, border: `1px solid ${RISK_COLOR[riskBreakdown.overall]}40`
                }}>
                  Net Verdict: {riskBreakdown.overall.replace('_', ' ')}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {riskBreakdown.factors.map((factor: RiskFactor) => (
                  <RiskFactorRow key={factor.id} factor={factor} />
                ))}
              </div>
            </div>

            <div className="card outline">
              <div className="section-title" style={{ marginBottom: '1rem', textAlign: 'center' }}>Factor Weight Distribution</div>
              <RiskWeightChart factors={riskBreakdown.factors} />
              
              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem', marginBottom: '0.2rem' }}>Domain Distribution Map</div>
                {['time', 'consistency', 'difficulty', 'prerequisites'].map(domain => {
                  const domainFactors = riskBreakdown.factors.filter((f: RiskFactor) => f.domain === domain);
                  const totalWeight = domainFactors.reduce((acc: number, f: RiskFactor) => acc + f.weight, 0);
                  if (totalWeight === 0) return null;
                  return (
                    <div key={domain} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text)', textTransform: 'capitalize' }}>{domain} Domain</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
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

      {state.activeTab === 'load' && (
        <div className="scale-in">
          <div className="card outline" style={{ minHeight: 400 }}>
            <div className="section-header" style={{ marginBottom: '2rem' }}>
              <div>
                <div className="section-title text-gradient" style={{ fontSize: '1.5rem' }}>Computational Burnout Analytics</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.25rem' }}>High-fidelity mapping of operational payload against system capacity constraints.</div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-elevated)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--primary)' }} /> Nominal Payload
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--danger)' }} /> Capacity Breach
                </span>
              </div>
            </div>
            
            <LoadBarChart loads={weeklyLoads} />
            
            <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontWeight: 700, marginBottom: '0.5rem' }}>
                <WarningIcon /> System Recommendation
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-soft)', lineHeight: 1.5, margin: 0 }}>
                {weeklyLoads.filter(l => l.overload).length > 0 
                  ? `Hardware limit (${maxHoursPerWeek}h/wk) breached in ${weeklyLoads.filter(l => l.overload).length} blocks. Utilize the Timeline Planner's bin-packing engine to redistribute load.`
                  : `All operational blocks are within the ${maxHoursPerWeek}h safety margin. No corrective action required.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {state.activeTab === 'confidence' && probTimeline && (
        <div className="scale-in">
          <div className="card outline" style={{ minHeight: 500 }}>
             <div className="section-header" style={{ marginBottom: '2rem' }}>
              <div>
                <div className="section-title text-gradient" style={{ fontSize: '1.5rem' }}>Monte-Carlo Trajectory Model</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Simulated probability mapping charting confidence decay across future computational blocks.</div>
              </div>
            </div>
            <ConfidenceTimelineChart timeline={probTimeline.points} />
            
            <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
               <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderTop: '2px solid var(--success)' }}>
                 <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>Starting Confidence</div>
                 <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginTop: '0.2rem', textTransform: 'capitalize' }}>{probTimeline.points[0]?.band.replace('_', ' ') || 'Unknown'}</div>
               </div>
               <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderTop: '2px solid var(--warning)' }}>
                 <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>Lowest Point</div>
                 <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginTop: '0.2rem', textTransform: 'capitalize' }}>{
                   probTimeline.points.reduce((lowest, p) => BAND_VALUE[p.band] < BAND_VALUE[lowest.band] ? p : lowest, probTimeline.points[0])?.band.replace('_', ' ') || 'Unknown'
                 }</div>
               </div>
                <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderTop: '2px solid var(--primary)' }}>
                 <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>Terminal Trajectory</div>
                 <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginTop: '0.2rem', textTransform: 'capitalize' }}>{probTimeline.points[probTimeline.points.length-1]?.band.replace('_', ' ') || 'Unknown'}</div>
               </div>
            </div>
          </div>
        </div>
      )}

      {state.activeTab === 'efficiency' && (
         <div className="scale-in">
           <div className="card outline" style={{ minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
             
             {/* Background logic graphic */}
             <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.02, pointerEvents: 'none' }}>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />
             </svg>

             <div style={{ zIndex: 1, textAlign: 'center', maxWidth: 600 }}>
               <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)' }}>Bin-Packing Efficiency Rating</h3>
               <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
                 This index measures how tightly execution blocks are packed. A rating of 100% means zero wasted capacity up to the hardware boundary.
               </p>
               
               <div style={{ position: 'relative', width: 240, height: 240, margin: '0 auto', filter: 'drop-shadow(0 10px 30px rgba(79, 140, 255, 0.2))' }}>
                 <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <circle cx="50" cy="50" r="45" fill="var(--bg-elevated)" stroke="var(--border)" strokeWidth="2" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" 
                       strokeDasharray={`${(efficiency / 100) * 282.74} 282.74`} transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                    />
                    <text x="50" y="55" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text)">{efficiency}%</text>
                    <text x="50" y="68" textAnchor="middle" fontSize="8" fill="var(--muted-soft)" letterSpacing="1">RATING</text>
                 </svg>
               </div>

               <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                 {efficiency < 80 && (
                   <Link href="/timeline">
                     <button className="button primary-gradient">Launch Auto-Optimizer</button>
                   </Link>
                 )}
               </div>
             </div>
           </div>
         </div>
      )}

    </div>
  );
}

// ─── Sub-Components ───

function TelemetryCard({ label, value, unit, trend, color }: any) {
  return (
    <div className="stat-card hoverable" style={{ borderTop: `2px solid ${color}`, background: `linear-gradient(180deg, ${color}05 0%, transparent 100%)` }}>
      <div className="stat-label" style={{ fontSize: '0.7rem' }}>{label}</div>
      <div className="stat-value" style={{ color, fontSize: '1.5rem', fontWeight: 800 }}>
        {value}<span className="stat-unit" style={{ fontSize: '1rem', marginLeft: '2px' }}>{unit}</span>
      </div>
      <div className="stat-trend neutral" style={{ fontSize: '0.65rem' }}>{trend}</div>
    </div>
  );
}

function DeltaStat({ label, v1, v2, unit, invert = false }: any) {
  const delta = Number(v2) - Number(v1);
  const isGood = invert ? delta <= 0 : delta >= 0;
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginTop: '0.2rem' }}>
        {v2}{unit} <span style={{ fontSize: '0.8rem', color: isGood ? 'var(--success)' : 'var(--danger)', marginLeft: '0.2rem' }}>({delta > 0 ? '+' : ''}{delta}{unit})</span>
      </div>
    </div>
  );
}

function OverviewMiniStat({ label, value, color }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--muted-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color, marginTop: '0.2rem', textTransform: 'capitalize' }}>{value}</div>
    </div>
  );
}

function RiskFactorRow({ factor }: { factor: RiskFactor }) {
  const color = RISK_COLOR[factor.level] ?? 'var(--muted)';
  return (
    <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>{factor.label}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {factor.domain}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.4rem', lineHeight: 1.5, maxWidth: 500 }}>
            {factor.description}
          </p>
        </div>
        <div style={{ 
          fontSize: '0.75rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.05em',
          background: `${color}15`, padding: '0.25rem 0.5rem', borderRadius: 4, border: `1px solid ${color}30`
        }}>
          {factor.level.replace('_', ' ')}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Engine Weight</span>
        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
          <div style={{ height: '100%', width: `${factor.weight * 100}%`, background: `linear-gradient(90deg, ${color}40, ${color})`, borderRadius: 99, transition: TRANSITION_SPRING }} />
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', width: 35, textAlign: 'right' }}>
          {Math.round(factor.weight * 100)}%
        </span>
      </div>
    </div>
  );
}

function RiskWeightChart({ factors }: { factors: RiskFactor[] }) {
  const size = 260;
  const cx = size / 2, cy = size / 2, r = 100;
  let startAngle = -Math.PI / 2;
  const total = factors.reduce((a, f) => a + f.weight, 0);
  const colors = ['#4f8cff', '#c084fc', '#f59e0b', '#f87171', '#34d399'];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
      <svg width={size} height={size} style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))' }}>
        {factors.map((f, i) => {
          const angle = (f.weight / total) * 2 * Math.PI;
          const endAngle = startAngle + angle;
          const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
          const largeArc = angle > Math.PI ? 1 : 0;
          const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
          startAngle = endAngle;
          return <path key={f.id} d={d} fill={colors[i % colors.length]} opacity={0.9} stroke="var(--card)" strokeWidth={2} />;
        })}
        {/* Inner donut hole */}
        <circle cx={cx} cy={cy} r={60} fill="var(--card)" />
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize={18} fontWeight={800} fill="var(--text)">100%</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="var(--muted)" letterSpacing={1}>DISTRIBUTION</text>
      </svg>
    </div>
  );
}

function LoadBarChart({ loads }: { loads: { weekIndex: number; plannedHours: number; maxHours: number; overload: boolean }[] }) {
  const maxVal = Math.max(...loads.map(l => l.plannedHours), 15);
  const H = 280, barW = 20, gap = 6;
  const totalW = loads.length * (barW + gap);

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '1rem', width: '100%' }}>
      <svg width={Math.max(totalW + 40, 600)} height={H + 40} style={{ display: 'block', margin: '0 auto' }}>
        <defs>
          <linearGradient id="barNorm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f8cff" />
            <stop offset="100%" stopColor="rgba(79,140,255,0.4)" />
          </linearGradient>
          <linearGradient id="barWarn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="rgba(245,158,11,0.4)" />
          </linearGradient>
          <linearGradient id="barErr" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="rgba(239,68,68,0.4)" />
          </linearGradient>
          <filter id="glow">
             <feGaussianBlur stdDeviation="4" result="blur" />
             <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Global Hardware Limit Line */}
        <g opacity={0.7}>
          <line x1={0} x2={Math.max(totalW + 40, 600)} y1={H - (15 / maxVal) * H} y2={H - (15 / maxVal) * H} stroke="var(--danger)" strokeDasharray="4,4" strokeWidth={1} />
          <text x={0} y={H - (15 / maxVal) * H - 6} fontSize={10} fontWeight={600} fill="var(--danger)">Hardware Cap (15h)</text>
          <rect x={0} y={0} width={Math.max(totalW + 40, 600)} height={H - (15 / maxVal) * H} fill="url(#barErr)" opacity={0.05} />
        </g>

        <g transform="translate(10, 0)">
          {loads.map((l, i) => {
            const barH = Math.max(2, (l.plannedHours / maxVal) * H);
            const x = i * (barW + gap);
            const y = H - barH;
            
            let fill = 'url(#barNorm)';
            if (l.overload) fill = 'url(#barErr)';
            else if (l.plannedHours > 12) fill = 'url(#barWarn)';

            return (
              <g key={l.weekIndex}>
                <rect x={x} y={y} width={barW} height={barH} rx={4} fill={fill} filter={l.overload ? "url(#glow)" : ""} style={{ transition: TRANSITION_SPRING }} />
                
                <text x={x + barW / 2} y={y - 8} textAnchor="middle" fontSize={9} fontWeight={700} fill={l.overload ? 'var(--danger)' : 'var(--text)'}>
                   {l.plannedHours}
                </text>

                {(i % 2 === 0 || l.overload) && (
                  <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize={9} fill="var(--muted)">
                    W{l.weekIndex}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function ConfidenceTimelineChart({ timeline }: { timeline: { stepIndex: number; band: string }[] }) {
  const H = 250, padX = 40, padY = 20;
  const W = Math.max(700, timeline.length * 18);

  return (
    <div style={{ overflowX: 'auto', width: '100%', paddingBottom: '1rem' }}>
      <svg width={W + padX * 2} height={H + padY * 2} style={{ display: 'block', margin: '0 auto' }}>
        <defs>
          <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(79,140,255,0.4)" />
            <stop offset="100%" stopColor="rgba(79,140,255,0.01)" />
          </linearGradient>
        </defs>

        {/* Y-axis logic */}
        {['very_high', 'high', 'medium', 'low', 'very_low'].map((b, i) => {
          const y = padY + (i / 4) * H;
          return (
            <g key={b}>
              <line x1={padX} x2={W + padX} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
              <text x={padX - 8} y={y + 3} textAnchor="end" fontSize={9} fontWeight={600} fill={CONF_COLOR[b]} opacity={0.8} textTransform="capitalize">
                {b.replace('_', ' ')}
              </text>
            </g>
          );
        })}

        {/* Data curve */}
        {(() => {
          // Map abstract bands to Y values for charting
          const pts = timeline.map((p, i) => {
            const x = padX + (i / Math.max(timeline.length - 1, 1)) * W;
            const v = BAND_VALUE[p.band] ?? 50; 
            const y = padY + H - (v / 100) * H;
            return { x, y, band: p.band };
          });
          
          const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
          const area = `M${pts[0].x},${padY + H} ${polyline} L${pts[pts.length - 1].x},${padY + H} Z`;

          return (
            <g style={{ transition: TRANSITION_SPRING }}>
              <path d={area} fill="url(#areaGrad)" />
              <polyline points={polyline} fill="none" stroke="var(--primary)" strokeWidth={3} strokeLinejoin="round" />
              
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={p.band === 'low' || p.band === 'very_low' ? 5 : 3} fill={CONF_COLOR[p.band]} stroke="var(--bg-elevated)" strokeWidth={2} />
              ))}
            </g>
          );
        })()}

        {/* X-axis */}
        {timeline.filter((_, i) => i % 5 === 0 || i === timeline.length - 1).map((p, i) => {
          const x = padX + (p.stepIndex / Math.max(timeline.length - 1, 1)) * W;
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={padY + H} y2={padY + H + 5} stroke="rgba(255,255,255,0.2)" />
              <text x={x} y={padY + H + 18} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--muted)">Wk {p.stepIndex}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Icons ───
function CompareIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M3 8V3h5M3 3l6.5 6.5"/></svg>;
}
function RefreshIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;
}
function InfoIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
}
function WarningIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
