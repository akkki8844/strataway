'use client';
import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const VARIANT_STYLE: Record<BadgeVariant, { color: string; bg: string; border: string }> = {
  default: { color: 'var(--text)', bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.1)' },
  success: { color: '#4ade80', bg: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.25)' },
  warning: { color: '#fbbf24', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.25)' },
  danger:  { color: '#f87171', bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.25)' },
  info:    { color: '#6ea2ff', bg: 'rgba(79,140,255,0.14)', border: 'rgba(79,140,255,0.25)' },
  muted:   { color: 'var(--muted)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.06)' },
};

export default function Badge({ children, variant = 'default', dot = false, size = 'md', className }: BadgeProps) {
  const s = VARIANT_STYLE[variant];
  const fontSize = size === 'sm' ? '0.625rem' : '0.72rem';
  const padding = size === 'sm' ? '0.1rem 0.35rem' : '0.2rem 0.55rem';
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        padding, borderRadius: 99,
        fontSize, fontWeight: 600, letterSpacing: '0.02em',
        color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      }}
    >
      {dot && (
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      )}
      {children}
    </span>
  );
}
