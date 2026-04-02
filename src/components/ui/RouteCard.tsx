'use client';
import React from 'react';
import { RoutePlan } from '../../../types/route';
import { RouteAnalyticsSummary } from '../../../types/analytics';

interface RouteCardProps {
  route: RoutePlan;
  analytics: RouteAnalyticsSummary;
  isActive: boolean;
  onActivate: (id: string) => void;
}

export default function RouteCard({ route, analytics, isActive, onActivate }: RouteCardProps) {
  const { meta, weeks, cost, tasks } = route;
  const { risk, sustainability, currentConfidence, pace } = analytics;

  return (
    <div className={`card hoverable ${isActive ? 'glow-primary' : ''}`} style={{
      border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
      background: isActive ? 'var(--bg-elevated)' : 'var(--card)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className={`route-chip ${meta.profile}`} style={{ marginBottom: '0.5rem' }}>{meta.profile}</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{meta.label}</h3>
        </div>
        {isActive && (
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-glow)', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
            Active
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="stat-mini">
          <label style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</label>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{weeks} <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '0.75rem' }}>weeks</small></div>
        </div>
        <div className="stat-mini">
          <label style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Effort</label>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{cost.totalHours} <small style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '0.75rem' }}>hours</small></div>
        </div>
      </div>

      <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--muted)' }}>Risk Level</span>
          <span className={`risk-${risk}`} style={{ fontWeight: 700 }}>{risk.replace('_', ' ')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--muted)' }}>Sustainability</span>
          <span style={{ color: `var(--${sustainability === 'stable' ? 'success' : sustainability === 'fragile' ? 'danger' : 'warning'})`, fontWeight: 700 }}>{sustainability}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--muted)' }}>Confidence</span>
          <span className={`conf-${currentConfidence}`} style={{ fontWeight: 700 }}>{currentConfidence.replace('_', ' ')}</span>
        </div>
      </div>

      <button 
        className={`button ${isActive ? 'primary' : 'secondary'}`} 
        style={{ width: '100%', marginTop: 'auto' }}
        onClick={() => onActivate(meta.id)}
      >
        {isActive ? 'Currently Active' : 'Select Route'}
      </button>
    </div>
  );
}
