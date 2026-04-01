'use client';
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'flat' | 'outline' | 'elevated' | 'glass';
  hoverable?: boolean;
  padding?: string;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

const VARIANT_STYLE: Record<string, React.CSSProperties> = {
  default: { background: 'var(--card)', boxShadow: 'var(--shadow-sm)' },
  flat:    { background: 'var(--card)', boxShadow: 'none' },
  outline: { background: 'var(--card)', boxShadow: 'none', border: '1px solid var(--border)' },
  elevated:{ background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-md)' },
  glass:   {
    background: 'rgba(18,24,38,0.7)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: 'var(--shadow-sm)',
  },
};

export default function Card({
  children, variant = 'default', hoverable = false,
  padding = '1rem', style, className, onClick,
}: CardProps) {
  return (
    <div
      className={['card', hoverable ? 'hoverable' : '', className].filter(Boolean).join(' ')}
      onClick={onClick}
      style={{
        ...VARIANT_STYLE[variant],
        padding,
        borderRadius: 'var(--radius-lg)',
        cursor: onClick ? 'pointer' : undefined,
        transition: hoverable ? 'transform var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
