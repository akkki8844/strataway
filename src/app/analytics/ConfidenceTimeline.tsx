'use client';

import React from 'react';
import { ProbabilityTimeline, ConfidenceBand } from '../../../types/analytics';

interface ConfidenceTimelineProps {
  timeline: ProbabilityTimeline;
  currentWeek?: number;
  height?: number;
}

const BAND_Y_PCT: Record<ConfidenceBand, number> = {
  very_high: 0.1,
  high: 0.3,
  medium: 0.55,
  low: 0.73,
  very_low: 0.9,
};

const BAND_COLOR: Record<ConfidenceBand, string> = {
  very_high: '#22c55e',
  high: '#4ade80',
  medium: '#60a5fa',
  low: '#f59e0b',
  very_low: '#ef4444',
};

const BAND_LABEL: Record<ConfidenceBand, string> = {
  very_high: 'Very High',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  very_low: 'Very Low',
};

/**
 * ConfidenceTimeline — renders a smooth SVG area chart of confidence band
 * over the route lifetime. Bands are treated as ordinal, mapped to y-axis
 * percentages, and connected with a cubic-bezier spline.
 */
export default function ConfidenceTimeline({
  timeline,
  currentWeek,
  height = 180,
}: ConfidenceTimelineProps) {
  const padLeft = 80;
  const padRight = 20;
  const padTop = 16;
  const padBottom = 28;
  const innerH = height - padTop - padBottom;

  const points = timeline.points;
  if (points.length === 0) return null;

  const totalSteps = points.length;

  const toX = (i: number) =>
    padLeft + (i / Math.max(totalSteps - 1, 1)) * (900 - padLeft - padRight);
  const toY = (band: ConfidenceBand) =>
    padTop + BAND_Y_PCT[band] * innerH;

  // Build smooth polyline via midpoint smoothing
  const coordPairs = points.map((p: any, i: number) => ({
    x: toX(i),
    y: toY(p.band as ConfidenceBand),
    band: p.band as ConfidenceBand,
  }));

  // SVG smooth path using cubic bezier
  const linePath = coordPairs.reduce((acc: string, pt: any, i: number) => {
    if (i === 0) return `M${pt.x},${pt.y}`;
    const prev = coordPairs[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  const areaPath =
    `${linePath} L${coordPairs[coordPairs.length - 1].x},${padTop + innerH} L${coordPairs[0].x},${padTop + innerH} Z`;

  const gradId = `confTimelineGrad_${timeline.routeId}`;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 900 ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', minWidth: 400, display: 'block' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f8cff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#4f8cff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis band lines */}
        {(Object.keys(BAND_Y_PCT) as ConfidenceBand[]).map((band) => {
          const y = padTop + BAND_Y_PCT[band] * innerH;
          return (
            <g key={band}>
              <line
                x1={padLeft} x2={900 - padRight} y1={y} y2={y}
                stroke="rgba(255,255,255,0.05)" strokeWidth={1}
              />
              <text
                x={padLeft - 6} y={y + 4}
                textAnchor="end" fontSize={9}
                fill={BAND_COLOR[band]} fontFamily="Inter, sans-serif"
              >
                {BAND_LABEL[band]}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradId})`} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data points — sampled every 5 steps */}
        {coordPairs
          .filter((_: any, i: number) => i % 5 === 0 || i === coordPairs.length - 1)
          .map((pt: any, i: number) => (
            <circle
              key={i}
              cx={pt.x} cy={pt.y} r={3.5}
              fill={BAND_COLOR[pt.band as ConfidenceBand]}
              stroke="var(--bg-soft)" strokeWidth={1.5}
            />
          ))}

        {/* Current week marker */}
        {currentWeek !== undefined && currentWeek < points.length && (
          <g>
            <line
              x1={toX(currentWeek)} x2={toX(currentWeek)}
              y1={padTop} y2={padTop + innerH}
              stroke="rgba(79,140,255,0.5)" strokeWidth={1.5}
              strokeDasharray="4,3"
            />
            <text
              x={toX(currentWeek) + 4} y={padTop + 10}
              fontSize={8} fill="var(--primary)" fontFamily="Inter, sans-serif"
            >
              Now
            </text>
          </g>
        )}

        {/* X-axis labels */}
        {points
          .filter((_: any, i: number) => i % Math.max(1, Math.floor(points.length / 8)) === 0)
          .map((p: any) => (
            <text
              key={p.stepIndex}
              x={toX(p.stepIndex)} y={height - 4}
              textAnchor="middle" fontSize={8}
              fill="var(--muted-soft)" fontFamily="Inter, sans-serif"
            >
              Wk{p.stepIndex + 1}
            </text>
          ))}
      </svg>
    </div>
  );
}
