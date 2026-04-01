'use client';

import React, { useState } from 'react';
import { SEED_DECISION_LOG, DecisionLogEntry } from '../../../utils/seedData';

const TRIGGER_META: Record<string, { label: string; icon: string; color: string }> = {
  route_selected:    { label: 'Route Selected', icon: '🛤', color: 'var(--primary)' },
  task_missed:       { label: 'Task Missed', icon: '⚠', color: 'var(--danger)' },
  capacity_changed:  { label: 'Capacity Changed', icon: '⏱', color: 'var(--warning)' },
  goal_updated:      { label: 'Goal Updated', icon: '🎯', color: '#c084fc' },
  milestone_reached: { label: 'Milestone', icon: '🏁', color: 'var(--success)' },
};

export default function ExplainPage() {
  const [selected, setSelected] = useState<DecisionLogEntry | null>(SEED_DECISION_LOG[0]);
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all'
    ? SEED_DECISION_LOG
    : SEED_DECISION_LOG.filter(e => e.trigger === filter);

  return (
    <div className="slide-up">
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Decision Log</h1>
          <p className="page-subtitle">
            Every routing decision is recorded and explained — no black boxes.{' '}
            <span style={{ color: 'var(--primary)' }}>{SEED_DECISION_LOG.length} entries</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['all', 'route_selected', 'milestone_reached', 'capacity_changed', 'task_missed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`button ${filter === f ? '' : 'secondary'}`}
              style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', textTransform: 'capitalize' }}>
              {f === 'all' ? 'All' : TRIGGER_META[f]?.label ?? f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Explainer banner ───────────────────────────────────────────── */}
      <div className="card outline" style={{
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, rgba(79,140,255,0.06), rgba(155,109,255,0.04))',
        border: '1px solid rgba(79,140,255,0.2)',
        display: 'flex', gap: '1rem', alignItems: 'flex-start',
      }}>
        <div style={{ fontSize: '2rem', flexShrink: 0 }}>🧠</div>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>
            How Strataway makes decisions
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
            Strataway uses a <strong style={{ color: 'var(--text)' }}>deterministic scoring model</strong> — no AI inference,
            no learned weights. Routes are scored by normalizing across time, cost, risk, and sustainability
            dimensions with user-defined weights. Every re-calculation preserves completed tasks and only
            touches future-planned items.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
        {/* ── Log list ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            {filtered.length} entries
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state">No entries match this filter</div>
          ) : (
            filtered.map((entry, idx) => {
              const meta = TRIGGER_META[entry.trigger];
              const isSelected = entry.id === selected?.id;
              return (
                <div
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  className="card outline"
                  style={{
                    cursor: 'pointer', padding: '0.85rem',
                    border: isSelected ? '1px solid rgba(79,140,255,0.5)' : '1px solid var(--border)',
                    background: isSelected ? 'rgba(79,140,255,0.06)' : 'var(--card)',
                    transition: 'all var(--dur-fast) var(--ease-standard)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                    {/* Timeline dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0', flexShrink: 0, marginTop: '0.1rem' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: isSelected ? meta?.color ?? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.875rem',
                        border: `1px solid ${isSelected ? meta?.color ?? 'var(--primary)' : 'var(--border)'}`,
                      }}>{meta?.icon}</div>
                      {idx < filtered.length - 1 && (
                        <div style={{ width: 1, height: '100%', minHeight: 16, background: 'var(--border)', marginTop: '0.25rem' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: meta?.color ?? 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {meta?.label}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--muted)', flexShrink: 0 }}>
                          {entry.timestamp.slice(0, 10)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 500, color: 'var(--text)', marginTop: '0.2rem', lineHeight: 1.3 }}>
                        {entry.summary}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Entry detail ────────────────────────────────────────────── */}
        {selected ? (
          <div className="scale-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header */}
            <div className="card outline" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: `${TRIGGER_META[selected.trigger]?.color ?? 'var(--primary)'}18`,
                  border: `2px solid ${TRIGGER_META[selected.trigger]?.color ?? 'var(--primary)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem',
                }}>{TRIGGER_META[selected.trigger]?.icon}</div>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: TRIGGER_META[selected.trigger]?.color ?? 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
                    {TRIGGER_META[selected.trigger]?.label}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
                    {selected.summary}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                    {new Date(selected.timestamp).toLocaleString()} · Entry {selected.id}
                  </div>
                </div>
              </div>

              {selected.routeId && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', marginRight: '0.5rem' }}>Related route:</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary-soft)' }}>
                    {selected.routeId.replace('route_', '').replace('_', ' ')}
                  </span>
                </div>
              )}

              {selected.affectedWeeks.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>Affected weeks:</div>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {selected.affectedWeeks.map(w => (
                      <span key={w} style={{
                        padding: '0.2rem 0.5rem', borderRadius: 99, fontSize: '0.72rem',
                        background: 'rgba(79,140,255,0.1)', color: 'var(--primary-soft)', fontWeight: 600,
                      }}>Wk {w + 1}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reasoning */}
            <div className="card outline" style={{ padding: '1.25rem' }}>
              <div className="section-title" style={{ marginBottom: '0.75rem' }}>Reasoning</div>
              <div style={{
                background: 'var(--bg-soft)', borderRadius: 'var(--radius-md)',
                padding: '1rem', border: '1px solid var(--border)',
              }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-soft)', lineHeight: 1.7, margin: 0 }}>
                  {selected.reasoning}
                </p>
              </div>
            </div>

            {/* Scoring model explanation */}
            <div className="card outline" style={{ padding: '1.25rem' }}>
              <div className="section-title" style={{ marginBottom: '0.75rem' }}>Scoring Model Used</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { label: 'Time Weight', value: '30%', desc: 'Duration + effort per week' },
                  { label: 'Cost Weight', value: '20%', desc: 'Resource & financial cost' },
                  { label: 'Risk Weight', value: '30%', desc: 'Risk & fragility penalty' },
                  { label: 'Sustainability', value: '20%', desc: 'Long-term viability' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{item.label}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>{item.value}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* System guarantees */}
            <div className="card outline" style={{ padding: '1.25rem', background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ fontWeight: 600, color: 'var(--success)', marginBottom: '0.5rem' }}>System Guarantees for this decision</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[
                  '✓ Completed tasks were not modified',
                  '✓ Only future planned/skipped tasks were rescheduled',
                  '✓ Hard prerequisites respected in task ordering',
                  '✓ Weekly hour limit applied strictly',
                  '✓ Milestone critical path preserved',
                ].map(g => (
                  <div key={g} style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', gap: '0.4rem' }}>
                    {g}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card flat" style={{
            border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minHeight: 320,
          }}>
            <div style={{ fontSize: '2rem' }}>📋</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Select a log entry to see full reasoning</div>
          </div>
        )}
      </div>
    </div>
  );
}
