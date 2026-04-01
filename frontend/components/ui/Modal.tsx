'use client';
import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}

export default function Modal({ isOpen, onClose, title, children, width = '500px' }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(5, 7, 10, 0.8)', backdropFilter: 'blur(4px)',
      padding: '1rem',
    }}>
      {/* Backdrop area click handler */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
      
      {/* Content */}
      <div
        ref={contentRef}
        className="scale-in"
        style={{
          position: 'relative', width: '100%', maxWidth: width,
          background: 'var(--card)', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          maxHeight: 'calc(100vh - 2rem)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        {(title) && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
          }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)' }}>{title}</h2>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.2rem' }}
            >
              ✕
            </button>
          </div>
        )}
        
        {/* Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
