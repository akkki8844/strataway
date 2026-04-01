'use client';
import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  width?: string;
}

export default function Dropdown({ trigger, children, align = 'left', width = '200px' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>
      {isOpen && (
        <div
          className="scale-in"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)',
            [align]: 0,
            width, zIndex: 100,
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
            padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem',
            animationDuration: '150ms',
          }}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Dropdown Item ──────────────────────────────────────────────────────────

export function DropdownItem({ children, onClick, danger = false }: {
  children: React.ReactNode; onClick?: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', textAlign: 'left',
        padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
        fontSize: '0.825rem', fontWeight: 500,
        color: danger ? 'var(--danger)' : 'var(--text-soft)',
        cursor: 'pointer', transition: 'all var(--dur-fast)',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        textDecoration: 'none',
        width: '100%',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)';
        e.currentTarget.style.color = danger ? 'var(--danger)' : 'var(--text)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'none';
        e.currentTarget.style.color = danger ? 'var(--danger)' : 'var(--text-soft)';
      }}
    >
      {children}
    </button>
  );
}
