'use client';
import React from 'react';

interface HeatmapCell { row: number; col: number; value: number; label?: string; }
interface HeatmapProps {
  cells: HeatmapCell[];
  rows: number;
  cols: number;
  cellSize?: number;
  gap?: number;
  minValue?: number;
  maxValue?: number;
  colorLow?: string;
  colorHigh?: string;
  rowLabels?: string[];
  colLabels?: string[];
  onCellClick?: (cell: HeatmapCell) => void;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
}

export default function Heatmap({
  cells, rows, cols,
  cellSize = 20, gap = 2,
  minValue = 0, maxValue = 1,
  colorLow = '#1a2744', colorHigh = '#4f8cff',
  rowLabels, colLabels,
  onCellClick,
}: HeatmapProps) {
  const [rl, g, bl] = hexToRgb(colorLow.replace('var(--card)', '#121826'));
  const [rh, gh, bh] = hexToRgb(colorHigh.replace('var(--primary)', '#4f8cff'));
  const labelW = rowLabels ? 64 : 0;
  const labelH = colLabels ? 20 : 0;

  const cellMap = new Map<string, HeatmapCell>(
    cells.map(c => [`${c.row}_${c.col}`, c])
  );

  const getColor = (val: number): string => {
    const t = Math.max(0, Math.min(1, (val - minValue) / Math.max(maxValue - minValue, 1)));
    const ri = Math.round(lerp(rl, rh, t));
    const gi = Math.round(lerp(g, gh, t));
    const bi = Math.round(lerp(bl, bh, t));
    return `rgb(${ri},${gi},${bi})`;
  };

  const totalW = labelW + cols * (cellSize + gap) - gap;
  const totalH = labelH + rows * (cellSize + gap) - gap;

  return (
    <svg width={totalW} height={totalH} style={{ display: 'block' }}>
      {/* Col labels */}
      {colLabels?.map((label, c) => (
        <text key={c}
          x={labelW + c * (cellSize + gap) + cellSize / 2} y={labelH - 4}
          textAnchor="middle" fontSize={8} fill="var(--muted-soft)" fontFamily="Inter">
          {label}
        </text>
      ))}

      {/* Row labels */}
      {rowLabels?.map((label, r) => (
        <text key={r}
          x={labelW - 4} y={labelH + r * (cellSize + gap) + cellSize / 2 + 3}
          textAnchor="end" fontSize={8} fill="var(--muted-soft)" fontFamily="Inter">
          {label}
        </text>
      ))}

      {/* Cells */}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const cell = cellMap.get(`${r}_${c}`);
          const val = cell?.value ?? 0;
          const x = labelW + c * (cellSize + gap);
          const y = labelH + r * (cellSize + gap);
          return (
            <rect key={`${r}_${c}`}
              x={x} y={y} width={cellSize} height={cellSize}
              rx={3} fill={getColor(val)}
              style={{ cursor: onCellClick ? 'pointer' : 'default', transition: 'transform 0.1s' }}
              onClick={() => onCellClick?.(cell ?? { row: r, col: c, value: val })}
            >
              {cell?.label && <title>{cell.label}</title>}
            </rect>
          );
        })
      )}
    </svg>
  );
}
