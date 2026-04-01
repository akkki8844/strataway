'use client';
import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export default function Tooltip({ content, children, position = 'top', delay = 120 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  };
  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div
      ref={triggerRef}
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div style={{
          position: 'absolute',
          ...(position === 'top' ? { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 } :
            position === 'bottom' ? { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 } :
            position === 'left' ? { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 } :
            { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 }),
          background: '#0f172a',
          color: '#e5e7eb',
          fontSize: '0.72rem',
          lineHeight: 1.5,
          padding: '0.4rem 0.7rem',
          borderRadius: 'var(--radius-sm)',
          whiteSpace: 'nowrap',
          boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
          zIndex: 999,
          pointerEvents: 'none',
          border: '1px solid rgba(255,255,255,0.1)',
          animation: 'fadeIn 100ms var(--ease-out) both',
        }}>
          {content}
        </div>
      )}
    </div>
  );
}
