'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '../../store/settingsStore';
import { DifficultyTolerance, ProgressPreference } from '../../../types/user';

export default function OnboardingPage() {
  const router = useRouter();
  const { setMaxHours, setDifficultyTolerance, setPreferredProgress, completeOnboarding } = useSettingsStore();
  
  const [step, setStep] = useState(1);
  const [hours, setHours] = useState(15);
  const [difficulty, setDifficulty] = useState<DifficultyTolerance>('medium');
  const [preference, setPreference] = useState<ProgressPreference>('balanced');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleFinish = () => {
    setMaxHours(hours);
    setDifficultyTolerance(difficulty);
    setPreferredProgress(preference);
    completeOnboarding();
    router.push('/dashboard');
  };

  if (!mounted) return null;

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg)',
      padding: '2rem'
    }}>
      <div className="glass-card scale-in" style={{ 
        maxWidth: '540px', 
        width: '100%', 
        padding: '3rem', 
        borderRadius: 'var(--radius-xl)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Progress Bar */}
        <div style={{ 
          position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)' 
        }}>
          <div style={{ 
            height: '100%', width: `${(step / 3) * 100}%`, background: 'var(--primary)', 
            transition: 'width 0.5s var(--ease-emphasized)',
            boxShadow: '0 0 10px var(--primary-glow)'
          }} />
        </div>

        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{ 
            width: '48px', height: '48px', background: 'var(--primary-glow)', 
            borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.25rem' 
          }}>
            {step === 1 ? '⏳' : step === 2 ? '🏔️' : '🚀'}
          </div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.04em' }}>
            {step === 1 ? 'Weekly Capacity' : step === 2 ? 'Growth Tolerance' : 'Success Profile'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.6 }}>
            {step === 1 
              ? 'How many hours per week can you realistically commit to your growth path?' 
              : step === 2 
                ? 'Select a difficulty level that matches your current comfort with steep learning curves.' 
                : 'What kind of navigation strategy should the system prioritize for you?'}
          </p>
        </div>

        {step === 1 && (
          <div className="fade-in">
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)' }}>Time Commitment</span>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{hours}h<small style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--muted)', marginLeft: '0.25rem' }}>/ week</small></span>
              </div>
              <input 
                type="range" min={3} max={30} value={hours} 
                onChange={(e) => setHours(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--muted-soft)' }}>
                <span>Light (3h)</span>
                <span>Balanced (15h)</span>
                <span>Intensive (30h)</span>
              </div>
            </div>
            <button className="button primary-gradient" style={{ width: '100%', padding: '1rem' }} onClick={() => setStep(2)}>
              Continue to Step 2
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2.5rem' }}>
              {(['low', 'medium', 'high'] as DifficultyTolerance[]).map((d) => (
                <button 
                  key={d} 
                  className={`card hoverable ${difficulty === d ? 'glow-primary' : ''}`}
                  style={{ 
                    padding: '1.25rem', textAlign: 'left', cursor: 'pointer',
                    border: difficulty === d ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: difficulty === d ? 'var(--bg-elevated)' : 'var(--card)'
                  }}
                  onClick={() => setDifficulty(d)}
                >
                  <div style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'capitalize', marginBottom: '0.25rem' }}>{d} Tolerance</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--muted)' }}>
                    {d === 'low' ? 'Prioritize smaller, manageable steps.' : d === 'medium' ? 'A balance of steady growth and challenges.' : 'Aggressive paths with high complexity.'}
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="button secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
              <button className="button primary-gradient" style={{ flex: 1 }} onClick={() => setStep(3)}>Next Step</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
              {(['fast', 'balanced', 'safe', 'prestige'] as ProgressPreference[]).map((p) => (
                <button 
                  key={p} 
                  className={`card hoverable ${preference === p ? 'glow-primary' : ''}`}
                  style={{ 
                    padding: '1.25rem', textAlign: 'center', cursor: 'pointer',
                    border: preference === p ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: preference === p ? 'var(--bg-elevated)' : 'var(--card)'
                  }}
                  onClick={() => setPreference(p)}
                >
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'capitalize' }}>{p}</div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="button secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>Back</button>
              <button className="button primary-gradient" style={{ flex: 1 }} onClick={handleFinish}>
                Initialize Navigation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
