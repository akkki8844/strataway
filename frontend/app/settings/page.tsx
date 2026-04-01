'use client';

import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useTimelineStore } from '../../store/timelineStore';
import { DifficultyTolerance, ProgressPreference } from '../../../types/user';

export default function SettingsPage() {
  const settings = useSettingsStore();
  const { adaptToCapacityChange } = useTimelineStore();
  const [saved, setSaved] = useState(false);
  const [localHours, setLocalHours] = useState(settings.maxHoursPerWeek);

  const handleSave = () => {
    settings.setMaxHours(localHours);
    adaptToCapacityChange(localHours);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="slide-up">
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your constraints, preferences, and system behavior</p>
        </div>
        <button onClick={handleSave} className="button" style={{ fontSize: '0.875rem' }}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* ── Time & Capacity ──────────────────────────────────────────── */}
        <div className="card outline">
          <SectionHead title="Time & Capacity" desc="Controls how routes are scheduled and loaded" />

          <SettingRow
            label="Max hours per week"
            desc="Your weekly learning budget. Affects task scheduling and overload detection."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Range: 3h → 30h</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>{localHours}h</span>
              </div>
              <input type="range" min={3} max={30} value={localHours}
                onChange={e => setLocalHours(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--muted-soft)' }}>
                <span>3h (very light)</span><span>15h (moderate)</span><span>30h (intense)</span>
              </div>
            </div>
          </SettingRow>

          <SettingRow
            label="Max budget"
            desc="Total resource budget across the route. Set to 0 for free-only resources."
          >
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>$</span>
              <input
                type="number" min={0} max={10000} step={50}
                value={settings.maxBudget ?? 0}
                onChange={e => settings.setMaxBudget(Number(e.target.value) || null)}
                className="input"
                style={{ fontSize: '0.875rem', padding: '0.5rem 0.65rem', maxWidth: 140 }}
              />
              <button className="button ghost" style={{ fontSize: '0.72rem' }}
                onClick={() => settings.setMaxBudget(null)}>
                Unlimited
              </button>
            </div>
          </SettingRow>
        </div>

        {/* ── Learning Style ───────────────────────────────────────────── */}
        <div className="card outline">
          <SectionHead title="Learning Style" desc="Shapes which route profile is recommended" />

          <SettingRow label="Difficulty tolerance" desc="How aggressively difficult material you're comfortable with">
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {(['low', 'medium', 'high'] as DifficultyTolerance[]).map(d => (
                <button key={d} onClick={() => settings.setDifficultyTolerance(d)}
                  className={`button ${settings.difficultyTolerance === d ? '' : 'secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', textTransform: 'capitalize' }}>
                  {d}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow label="Preferred pace" desc="Your default route profile — used during route generation">
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {(['fast', 'balanced', 'safe', 'prestige'] as ProgressPreference[]).map(p => (
                <button key={p} onClick={() => settings.setPreferredProgress(p)}
                  className={`button ${settings.preferredProgress === p ? '' : 'secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
                  <span className={`route-chip ${p}`} style={{ marginRight: '0.3rem', fontSize: '0.6rem' }}>{p}</span>
                </button>
              ))}
            </div>
          </SettingRow>
        </div>

        {/* ── Display ─────────────────────────────────────────────────── */}
        <div className="card outline">
          <SectionHead title="Display" desc="Visual preferences and information density" />

          <SettingRow label="Theme" desc="Visual theme mode">
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {(['dark', 'light', 'system'] as const).map(t => (
                <button key={t} onClick={() => settings.setTheme(t)}
                  className={`button ${settings.theme === t ? '' : 'secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', textTransform: 'capitalize' }}>
                  {t === 'dark' ? '🌙' : t === 'light' ? '☀️' : '💻'} {t}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow label="Advanced analytics" desc="Show confidence bands, risk factor weights, and burnout modeling">
            <ToggleSwitch
              checked={settings.showAdvancedAnalytics}
              onChange={settings.setShowAdvancedAnalytics}
            />
          </SettingRow>

          <SettingRow label="Explanation detail" desc="How verbose the Decision Log reasoning should be">
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {(['concise', 'standard', 'thorough'] as const).map(d => (
                <button key={d} onClick={() => settings.setExplanationDetail(d)}
                  className={`button ${settings.explanationDetail === d ? '' : 'secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', textTransform: 'capitalize' }}>
                  {d}
                </button>
              ))}
            </div>
          </SettingRow>
        </div>

        {/* ── Account ──────────────────────────────────────────────────── */}
        <div className="card outline">
          <SectionHead title="Account" desc="User profile details" />

          <SettingRow label="Display name" desc="Shown in the sidebar and reports">
            <input type="text" value={settings.name} onChange={() => {}}
              className="input" style={{ fontSize: '0.875rem', padding: '0.5rem 0.65rem', maxWidth: 220 }}
              readOnly />
          </SettingRow>

          <SettingRow label="Email" desc="Associated account email">
            <input type="email" value={settings.email} onChange={() => {}}
              className="input" style={{ fontSize: '0.875rem', padding: '0.5rem 0.65rem', maxWidth: 240 }}
              readOnly />
          </SettingRow>

          <SettingRow label="Onboarding" desc="Return to the initial setup wizard">
            <button className="button secondary" style={{ fontSize: '0.8rem' }}
              onClick={() => settings.completeOnboarding()}>
              Reset Onboarding
            </button>
          </SettingRow>
        </div>

        {/* ── Danger zone ──────────────────────────────────────────────── */}
        <div className="card outline" style={{ border: '1px solid rgba(239,68,68,0.25)', gridColumn: '1 / -1' }}>
          <SectionHead title="Reset" desc="Irreversible actions — proceed with caution" />
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="button danger" style={{ fontSize: '0.825rem' }}
              onClick={() => settings.resetSettings()}>
              Reset All Settings
            </button>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
              Restores all preferences to defaults. Task history and routes are not affected.
            </div>
          </div>
        </div>
      </div>

      {/* ── Save toast ────────────────────────────────────────────────── */}
      {saved && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          background: 'var(--card)', border: '1px solid rgba(34,197,94,0.4)',
          borderLeft: '4px solid var(--success)',
          padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)', zIndex: 99,
          fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }} className="toast-enter">
          <span style={{ color: 'var(--success)' }}>✓</span> Settings saved and timeline recalculated
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>{title}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.15rem' }}>{desc}</div>
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.15rem' }}>{label}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.4 }}>{desc}</div>
        </div>
        <div style={{ flexShrink: 0 }}>{children}</div>
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 99, cursor: 'pointer',
        background: checked ? 'var(--primary)' : 'rgba(255,255,255,0.12)',
        position: 'relative', transition: 'background var(--dur-fast) var(--ease-standard)',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        transition: 'left var(--dur-fast) var(--ease-standard)',
      }} />
    </div>
  );
}
