'use client';

import React from 'react';
import { RiskBreakdown, RiskFactor } from '../../../types/analytics';

interface RiskBreakdownProps {
  breakdown: RiskBreakdown;
}

const RISK_COLOR: Record<string, string> = {
  very_low: '#4ade80', low: '#86efac', medium: '#f59e0b', high: '#f87171', very_high: '#ef4444',
};
const DOMAIN_COLOR: Record<string, string> = {
  time: '#60a5fa', difficulty: '#c084fc', consistency: '#f59e0b',
  prerequisites: '#34d399', external: '#94a3b8',
};

/**
 * RiskBreakdownPanel — stacked breakdown of risk factors with a horizontal
 * stacked bar showing proportional weight by domain, plus factor cards.
 */
export default function RiskBreakdownPanel({ breakdown }: RiskBreakdownProps) {
  const totalWeight = breakdown.factors.reduce((a, f) => a + f.weight, 0);
  const overallColor = RISK_COLOR[breakdown.overall] ?? 'var(--muted)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Overall badge + stacked bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Overall Risk
          </span>
          <span style={{
            fontSize: '0.8rem', fontWeight: 700, color: overallColor,
            background: `${overallColor}18`, padding: '0.2rem 0.65rem', borderRadius: 99,
          }}>
            {breakdown.overall.replace('_', ' ')}
          </span>
        </div>

        {/* Stacked domain bar */}
        <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', gap: '1px' }}>
          {breakdown.factors.map((f) => (
            <div
              key={f.id}
              title={`${f.label}: ${Math.round(f.weight * 100)}%`}
              style={{
                flex: f.weight / totalWeight,
                background: DOMAIN_COLOR[f.domain] ?? '#94a3b8',
                transition: 'flex 0.8s var(--ease-out)',
              }}
            />
          ))}
        </div>

        {/* Domain legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
          {breakdown.factors.map((f) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: DOMAIN_COLOR[f.domain] ?? '#94a3b8', flexShrink: 0 }} />
              <span style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'capitalize' }}>{f.domain}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Factor rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {breakdown.factors.map((factor) => (
          <FactorRow key={factor.id} factor={factor} />
        ))}
      </div>
    </div>
  );
}

function FactorRow({ factor }: { factor: RiskFactor }) {
  const color = RISK_COLOR[factor.level] ?? 'var(--muted)';
  const domainColor = DOMAIN_COLOR[factor.domain] ?? '#94a3b8';
  const riskIdx: Record<string, number> = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
  const severityPct = ((riskIdx[factor.level] ?? 3) / 5) * 100;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)',
      padding: '0.65rem 0.75rem', border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: domainColor, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '0.825rem', fontWeight: 600, color: 'var(--text)' }}>{factor.label}</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color, padding: '0.1rem 0.4rem', borderRadius: 99, background: `${color}18` }}>
          {factor.level.replace('_', ' ')}
        </span>
      </div>

      {factor.description && (
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '0 0 0.4rem', lineHeight: 1.5 }}>
          {factor.description}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {[
          { label: 'severity', pct: severityPct, color },
          { label: 'weight', pct: factor.weight * 100, color: domainColor },
        ].map(bar => (
          <div key={bar.label} style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--muted)', marginBottom: '0.15rem' }}>
              <span>{bar.label}</span>
              <span style={{ color: bar.color, fontWeight: 700 }}>{Math.round(bar.pct)}%</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${bar.pct}%`, background: bar.color, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
