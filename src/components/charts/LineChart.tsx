'use client';

import React from 'react';

interface DataPoint { x: number; y: number; label?: string; }

interface LineChartProps {
  series: { id: string; label: string; color: string; data: DataPoint[] }[];
  height?: number;
  xLabel?: string;
  yLabel?: string;
  showDots?: boolean;
  showGrid?: boolean;
}

/**
 * LineChart — multi-series SVG line chart with hover tooltips,
 * grid lines, axis labels, and gradient fills per series.
 */
export default function LineChart({
  series, height = 200, xLabel, yLabel, showDots = true, showGrid = true,
}: LineChartProps) {
  const padL = 48, padR = 20, padT = 16, padB = 36;
  const viewW = 800, viewH = height;
  const innerW = viewW - padL - padR;
  const innerH = viewH - padT - padB;

  const allY = series.flatMap(s => s.data.map(d => d.y));
  const allX = series.flatMap(s => s.data.map(d => d.x));
  const minY = Math.min(...allY, 0);
  const maxY = Math.max(...allY, 1);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX, minX + 1);

  const toSVGX = (x: number) => padL + ((x - minX) / (maxX - minX)) * innerW;
  const toSVGY = (y: number) => padT + (1 - (y - minY) / (maxY - minY)) * innerH;

  const gridYCount = 4;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${viewW} ${viewH}`} style={{ width: '100%', minWidth: 320, display: 'block' }}>
        <defs>
          {series.map(s => (
            <linearGradient key={s.id} id={`lineGrad_${s.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Grid */}
        {showGrid && Array.from({ length: gridYCount + 1 }, (_, i) => {
          const val = minY + (maxY - minY) * (i / gridYCount);
          const y = toSVGY(val);
          return (
            <g key={i}>
              <line x1={padL} x2={viewW - padR} y1={y} y2={y}
                stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
              <text x={padL - 4} y={y + 4} textAnchor="end"
                fontSize={9} fill="var(--muted-soft)" fontFamily="Inter">
                {Math.round(val)}
              </text>
            </g>
          );
        })}

        {/* Series */}
        {series.map(s => {
          if (s.data.length === 0) return null;
          const pts = s.data.map(d => ({ sx: toSVGX(d.x), sy: toSVGY(d.y) }));
          const linePts = pts.map(p => `${p.sx},${p.sy}`).join(' ');
          const areaPath = `M${pts[0].sx},${padT + innerH} L${linePts.replace(/(\d+\.?\d*),(\d+\.?\d*)/g, (_m, x, y) => `${x},${y} `).trimEnd()} L${pts[pts.length - 1].sx},${padT + innerH} Z`;
          const linePath = pts.reduce((acc, pt, i) => {
            if (i === 0) return `M${pt.sx},${pt.sy}`;
            const prev = pts[i - 1];
            const cx = (prev.sx + pt.sx) / 2;
            return `${acc} C${cx},${prev.sy} ${cx},${pt.sy} ${pt.sx},${pt.sy}`;
          }, '');

          return (
            <g key={s.id}>
              <path d={`M${pts[0].sx},${padT + innerH} ${linePath.slice(1)} L${pts[pts.length - 1].sx},${padT + innerH} Z`}
                fill={`url(#lineGrad_${s.id})`} />
              <path d={linePath} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
              {showDots && pts.map((pt, i) => (
                <circle key={i} cx={pt.sx} cy={pt.sy} r={3} fill={s.color}
                  stroke="var(--bg-soft)" strokeWidth={1.5} />
              ))}
            </g>
          );
        })}

        {/* X-axis labels from first series */}
        {series[0]?.data.filter((_, i) => i % Math.max(1, Math.floor(series[0].data.length / 8)) === 0).map(d => (
          <text key={d.x} x={toSVGX(d.x)} y={viewH - 4}
            textAnchor="middle" fontSize={8} fill="var(--muted-soft)" fontFamily="Inter">
            {d.label ?? Math.round(d.x)}
          </text>
        ))}

        {/* Axis labels */}
        {xLabel && <text x={viewW / 2} y={viewH} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="Inter">{xLabel}</text>}
        {yLabel && <text x={10} y={viewH / 2} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="Inter" transform={`rotate(-90,10,${viewH / 2})`}>{yLabel}</text>}
      </svg>

      {/* Legend */}
      {series.length > 1 && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', paddingLeft: padL }}>
          {series.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--muted)' }}>
              <div style={{ width: 12, height: 2, background: s.color, borderRadius: 99 }} />
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
