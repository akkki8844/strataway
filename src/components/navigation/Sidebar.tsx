'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    section: 'Navigate',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: GridIcon, badge: null },
      { href: '/routes', label: 'Routes', icon: RouteIcon, badge: '4' },
      { href: '/skills', label: 'Skill Graph', icon: GraphIcon, badge: null },
      { href: '/timeline', label: 'Timeline', icon: CalendarIcon, badge: null },
    ],
  },
  {
    section: 'Insights',
    items: [
      { href: '/analytics', label: 'Analytics', icon: ChartIcon, badge: null },
      { href: '/explain', label: 'Decision Log', icon: LogIcon, badge: '3' },
    ],
  },
  {
    section: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: SettingsIcon, badge: null },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">S</div>
        <div>
          <div className="sidebar-logo-text">Strataway</div>
          <div className="sidebar-logo-sub">Navigation System</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-item${isActive ? ' active' : ''}`}
                >
                  <item.icon className="sidebar-item-icon" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="sidebar-item-badge">{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user-row">
          <div className="sidebar-avatar">AC</div>
          <div>
            <div className="sidebar-user-name">Alex Chen</div>
            <div className="sidebar-user-status">Balanced · Week 5 of 36</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Inline SVG Icons ──────────────────────────────────────────────────────

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function RouteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="4" cy="10" r="2" />
      <circle cx="16" cy="10" r="2" />
      <path d="M6 10h2c1 0 1.5-2 3-2s2 2 3 2h.5" strokeLinecap="round" />
    </svg>
  );
}

function GraphIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="4" r="2" />
      <circle cx="4" cy="15" r="2" />
      <circle cx="16" cy="15" r="2" />
      <line x1="10" y1="6" x2="4.8" y2="13.2" />
      <line x1="10" y1="6" x2="15.2" y2="13.2" />
      <line x1="6" y1="15" x2="14" y2="15" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="4" width="14" height="14" rx="2" />
      <line x1="3" y1="8" x2="17" y2="8" />
      <line x1="7" y1="2" x2="7" y2="6" strokeLinecap="round" />
      <line x1="13" y1="2" x2="13" y2="6" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <polyline points="3,15 7,9 11,12 17,5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="3" y1="17" x2="17" y2="17" />
    </svg>
  );
}

function LogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="3" width="12" height="15" rx="2" />
      <line x1="7" y1="7" x2="13" y2="7" strokeLinecap="round" />
      <line x1="7" y1="10" x2="13" y2="10" strokeLinecap="round" />
      <line x1="7" y1="13" x2="10" y2="13" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" strokeLinecap="round" />
    </svg>
  );
}
