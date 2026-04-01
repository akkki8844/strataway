import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '../components/navigation/Sidebar';

export const metadata: Metadata = {
  title: 'Strataway — Deterministic Navigation for Personal Growth',
  description:
    'Turn long-term goals into structured, graph-driven paths. Compare routes, plan weekly, and adapt when life changes.',
  keywords: 'goal planning, skill graph, learning paths, personal growth, structured planning',
  openGraph: {
    title: 'Strataway',
    description: 'Your deterministic navigation system for personal growth',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="app-main">
            <div className="page-content fade-in">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
