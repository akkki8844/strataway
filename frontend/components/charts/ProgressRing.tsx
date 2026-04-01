'use client';

import React from 'react';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  animated?: boolean;
}

/**
 * ProgressRing — animated SVG donut ring with center label.
 */
export default function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 10,
  color = 'var(--primary)',
  trackColor = 'rgba(255,255,255,0.06)',
  label,
  sublabel,
  animated = true,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clampedPct = Math.max(0, Math.min(100, percentage));
  const dashOffset = circumference - (clampedPct / 100) * circumference;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        {/* Fill */}
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={animated ? { transition: 'stroke-dashoffset 1s var(--ease-out)' } : undefined}
        />
      </svg>
      {(label || sublabel) && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          {label && <div style={{ fontSize: size > 100 ? '1.4rem' : '1rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{label}</div>}
          {sublabel && <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '0.15rem' }}>{sublabel}</div>}
        </div>
      )}
    </div>
  );
}
