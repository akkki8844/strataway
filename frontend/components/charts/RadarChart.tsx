'use client';
import React from 'react';

interface RadarChartProps {
  dimensions: { label: string; value: number; max?: number; color?: string }[];
  size?: number;
  fillColor?: string;
  strokeColor?: string;
}

export default function RadarChart({
  dimensions,
  size = 200,
  fillColor = 'rgba(79,140,255,0.18)',
  strokeColor = 'rgba(79,140,255,0.85)',
}: RadarChartProps) {
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 28;
  const n = dimensions.length;
  if (n < 3) return null;

  const angleFor = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2;

  const axisPoints = dimensions.map((_, i) => ({
    x: cx + r * Math.cos(angleFor(i)),
    y: cy + r * Math.sin(angleFor(i)),
  }));

  const dataPoints = dimensions.map((d, i) => {
    const ratio = Math.max(0, Math.min(1, d.value / (d.max ?? 1)));
    return {
      x: cx + r * ratio * Math.cos(angleFor(i)),
      y: cy + r * ratio * Math.sin(angleFor(i)),
    };
  });

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} style={{ display: 'block', overflow: 'visible' }}>
      {/* Grid rings */}
      {rings.map(scale => (
        <polygon key={scale}
          points={axisPoints.map(p => `${cx + (p.x - cx) * scale},${cy + (p.y - cy) * scale}`).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
      ))}

      {/* Axes */}
      {axisPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y}
          stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      ))}

      {/* Data polygon */}
      <polygon
        points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill={fillColor} stroke={strokeColor} strokeWidth={1.8}
      />

      {/* Labels */}
      {dimensions.map((d, i) => {
        const angle = angleFor(i);
        const lx = cx + (r + 18) * Math.cos(angle);
        const ly = cy + (r + 18) * Math.sin(angle);
        return (
          <text key={i} x={lx} y={ly + 4} textAnchor="middle"
            fontSize={9} fill="var(--muted)" fontFamily="Inter, sans-serif">
            {d.label}
          </text>
        );
      })}

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={strokeColor}
          stroke="var(--bg-soft)" strokeWidth={1.5} />
      ))}
    </svg>
  );
}
