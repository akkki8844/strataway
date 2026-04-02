'use client';
import React from 'react';
import { SkillNode, SkillMasteryState, SkillStatus } from '../../../types/skill';

interface SkillNodeProps {
  skill: SkillNode;
  mastery: SkillMasteryState;
  isSelected: boolean;
  isUnlocked: boolean;
  onSelect: (id: string) => void;
}

const STATUS_COLOR: Record<SkillStatus, string> = {
  locked: 'var(--muted-soft)',
  available: 'var(--warning)',
  in_progress: 'var(--primary)',
  mastered: 'var(--success)',
};

export default function SkillNodeCard({ skill, mastery, isSelected, isUnlocked, onSelect }: SkillNodeProps) {
  const { name, category, estimatedHours, difficulty } = skill;
  const { status, progress } = mastery;

  return (
    <div 
      className={`card hoverable ${isSelected ? 'glow-primary' : ''} ${!isUnlocked ? 'opacity-50' : ''}`} 
      onClick={() => isUnlocked && onSelect(skill.id)}
      style={{
        padding: '1rem',
        cursor: isUnlocked ? 'pointer' : 'not-allowed',
        borderLeft: `4px solid ${STATUS_COLOR[status]}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        minWidth: '180px',
        background: isSelected ? 'var(--bg-elevated)' : 'var(--card)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>
          {category.replace('_', ' ')}
        </span>
        {status === 'mastered' && <span style={{ color: 'var(--success)', fontSize: '0.875rem' }}>✓</span>}
      </div>
      
      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{name}</h4>
      
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--muted)' }}>
        <span>{estimatedHours}h</span>
        <span>•</span>
        <span style={{ textTransform: 'capitalize' }}>{difficulty}</span>
      </div>

      {status === 'in_progress' && (
        <div style={{ marginTop: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.2rem' }}>
            <span style={{ color: 'var(--primary-soft)' }}>Progress</span>
            <span style={{ color: 'var(--text)' }}>{progress}%</span>
          </div>
          <div className="progress" style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${progress}%`, 
                background: 'var(--primary)', 
                borderRadius: '2px',
                boxShadow: '0 0 8px var(--primary-glow)'
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
