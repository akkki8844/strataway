'use client';
import React from 'react';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  color?: string;
  disabled?: boolean;
}

export default function Slider({
  value, min, max, step = 1, onChange, color = 'var(--primary)', disabled = false
}: SliderProps) {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', height: '24px' }}>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        disabled={disabled}
        style={{
          width: '100%', margin: 0, position: 'absolute', opacity: 0,
          cursor: disabled ? 'not-allowed' : 'pointer', height: '100%', zIndex: 2,
        }}
      />
      {/* Custom Track */}
      <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', position: 'relative', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${percentage}%`, background: disabled ? 'var(--muted)' : color, borderRadius: '99px' }} />
      </div>
      {/* Custom Thumb */}
      <div style={{
        position: 'absolute', left: `${percentage}%`, top: '50%', transform: 'translate(-50%, -50%)',
        width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)', transition: 'background 0.2s', pointerEvents: 'none',
      }} />
    </div>
  );
}
