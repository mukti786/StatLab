import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StatLab — Explore data. Simulate ideas.',
  description: 'An interactive R programming and statistical simulation lab. Run genuine R in your browser with WebR.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
