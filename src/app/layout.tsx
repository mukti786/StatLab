import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  applicationName: 'StatLab',
  title: { default: 'StatLab — Learn R and statistics by experimenting', template: '%s · StatLab' },
  description: 'Learn R programming and statistics by running real experiments in your browser with WebR. No account or local R installation required.',
  openGraph: {
    type: 'website',
    siteName: 'StatLab',
    title: 'StatLab — Learn R and statistics by experimenting',
    description: 'A browser-based learning lab for R programming, statistical reasoning, and data exploration.',
  },
  twitter: {
    card: 'summary',
    title: 'StatLab — Learn R and statistics by experimenting',
    description: 'A browser-based learning lab for R programming, statistical reasoning, and data exploration.',
  },
};

export const viewport: Viewport = { themeColor: '#080b13' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
