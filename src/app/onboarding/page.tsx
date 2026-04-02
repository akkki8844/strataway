'use client';

import React, { useState } from 'react';
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

  const handleFinish = () => {
    setMaxHours(hours);
    setDifficultyTolerance(difficulty);
    setPreferredProgress(preference);
    completeOnboarding();
    router.push('/dashboard');
  };

  return (
    <div className="onboarding-container" style={{
      maxWidth: '600px',
      margin: '100px auto',
      padding: '2rem',
      background: 'var(--card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-xl)',
    }}>
      <div className="onboarding-content">
        {step === 1 && (
          <div className="onboarding-step fade-in">
            <h1 className="page-title" style={{ marginBottom: '1rem' }}>Welcome to Strataway</h1>
            <p className="page-subtitle" style={{ marginBottom: '2rem' }}>
              Let's set up your personal growth parameters. First, how many hours can you commit per week?
            </p>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Commitment</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{hours}h / week</span>
              </div>
              <input 
                type="range" 
                min={3} 
                max={30} 
                value={hours} 
                onChange={(e) => setHours(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>
            <button className="button" style={{ width: '100%' }} onClick={() => setStep(2)}>Next Step</button>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step fade-in">
            <h1 className="page-title" style={{ marginBottom: '1rem' }}>Difficulty Tolerance</h1>
            <p className="page-subtitle" style={{ marginBottom: '2rem' }}>
              How comfortable are you with steep learning curves?
            </p>
            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2rem' }}>
              {(['low', 'medium', 'high'] as DifficultyTolerance[]).map((d) => (
                <button 
                  key={d} 
                  className={`button ${difficulty === d ? '' : 'secondary'}`} 
                  style={{ flex: 1, textTransform: 'capitalize' }}
                  onClick={() => setDifficulty(d)}
                >
                  {d}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="button secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
              <button className="button" style={{ flex: 1 }} onClick={() => setStep(3)}>Next Step</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step fade-in">
            <h1 className="page-title" style={{ marginBottom: '1rem' }}>Preferred Pace</h1>
            <p className="page-subtitle" style={{ marginBottom: '2rem' }}>
              What kind of route profile do you prefer for your navigation?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '2rem' }}>
              {(['fast', 'balanced', 'safe', 'prestige'] as ProgressPreference[]).map((p) => (
                <button 
                  key={p} 
                  className={`button ${preference === p ? '' : 'secondary'}`} 
                  style={{ textTransform: 'capitalize' }}
                  onClick={() => setPreference(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="button secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>Back</button>
              <button className="button" style={{ flex: 1 }} onClick={handleFinish}>Start Growing</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
