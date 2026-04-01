'use client';

import React from 'react';
import { ConfidenceBand } from '../../../types/analytics';

interface ProbabilityMeterProps {
  band: ConfidenceBand;
  label?: string;
  showScale?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const BAND_CONFIG: Record<ConfidenceBand, {
  color: string;
  bg: string;
  pct: number;
  description: string;
}> = {
  very_high: { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', pct: 92, description: 'Excellent alignment with constraints' },
  high:      { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', pct: 74, description: 'Good fit with minor gaps' },
  medium:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', pct: 55, description: 'Moderate mismatch — monitor carefully' },
  low:       { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', pct: 34, description: 'Notable gaps — consider adjusting constraints' },
  very_low:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', pct: 14, description: 'High mismatch — route likely infeasible' },
};

const SIZE_CONFIG = {
  sm: { arcSize: 80, strokeWidth: 8, fontSize: '1rem', labelSize: '0.65rem' },
  md: { arcSize: 120, strokeWidth: 11, fontSize: '1.5rem', labelSize: '0.75rem' },
  lg: { arcSize: 160, strokeWidth: 14, fontSize: '2rem', labelSize: '0.875rem' },
};

/**
 * ProbabilityMeter — a semicircular arc gauge showing confidence band.
 * Uses SVG arcs with stroke-dasharray tricks for the fill.
 */
export default function ProbabilityMeter({
  band,
  label,
  showScale = true,
  size = 'md',
}: ProbabilityMeterProps) {
  const cfg = BAND_CONFIG[band];
  const dim = SIZE_CONFIG[size];

  const R = (dim.arcSize - dim.strokeWidth) / 2;
  const cx = dim.arcSize / 2;
  const cy = dim.arcSize / 2;

  // Full semicircle arc (180°) using stroke-dasharray
  const arcLength = Math.PI * R; // half circumference
  const fillLength = (cfg.pct / 100) * arcLength;
  const gapLength = arcLength - fillLength;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      {label && (
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </div>
      )}

      <div style={{ position: 'relative', width: dim.arcSize, height: dim.arcSize / 2 + dim.strokeWidth / 2 }}>
        <svg
          width={dim.arcSize}
          height={dim.arcSize}
          style={{ overflow: 'visible', transform: 'rotate(180deg)' }}
        >
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={dim.strokeWidth}
            strokeDasharray={`${arcLength} ${arcLength}`}
            strokeDashoffset={-arcLength}
            strokeLinecap="round"
          />

          {/* Fill */}
          <circle
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke={cfg.color}
            strokeWidth={dim.strokeWidth}
            strokeDasharray={`${fillLength} ${arcLength - fillLength + arcLength}`}
            strokeDashoffset={-arcLength}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${cfg.color}66)`, transition: 'stroke-dasharray 1s var(--ease-out)' }}
          />
        </svg>

        {/* Value overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: dim.fontSize, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>
            {cfg.pct}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: '0.1rem', fontWeight: 500 }}>
            /100
          </div>
        </div>
      </div>

      {/* Band label */}
      <div style={{
        padding: '0.3rem 0.85rem', borderRadius: 99, fontSize: dim.labelSize,
        fontWeight: 700, color: cfg.color, background: cfg.bg,
      }}>
        {band.replace('_', ' ')}
      </div>

      {/* Description */}
      {showScale && (
        <div style={{
          fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center',
          lineHeight: 1.5, maxWidth: 180,
        }}>
          {cfg.description}
        </div>
      )}

      {/* Scale */}
      {showScale && (
        <div style={{ width: '100%', maxWidth: 180 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--muted-soft)', marginBottom: '0.2rem' }}>
            <span>Very Low</span><span>Very High</span>
          </div>
          <div style={{ height: 3, background: 'linear-gradient(90deg, #ef4444, #f59e0b, #60a5fa, #4ade80, #22c55e)', borderRadius: 99 }} />
          <div style={{ position: 'relative', marginTop: '0.15rem' }}>
            <div style={{
              position: 'absolute',
              left: `${cfg.pct}%`,
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: `5px solid ${cfg.color}`,
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
