import type { Metadata, Viewport } from 'next';
import { Anybody, Schibsted_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const display = Anybody({ subsets: ['latin'], axes: ['wdth'], variable: '--font-display', display: 'swap' });
const sans = Schibsted_Grotesk({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap', weight: ['400', '500', '600'] });

const site = 'https://raorla.github.io';

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: 'Orlando Rasolofoniaina · AI Engineer',
  description: 'Orlando Rasolofoniaina, AI Engineer in Lyon. I build LLM agents that ship real work, with the guardrails written in code.',
  alternates: { canonical: '/' },
  icons: { icon: '/assets/avatar-dark.png', apple: '/assets/avatar-dark.png' },
  openGraph: {
    type: 'website', url: site, title: 'Orlando Rasolofoniaina · AI Engineer',
    description: 'I build AI agents that ship real work, with the guardrails written in code.',
    images: [{ url: '/assets/og.jpg', width: 1200, height: 630, alt: 'Orlando Rasolofoniaina, AI Engineer: I build AI agents that ship real work.' }],
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = { themeColor: '#07080E', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

const person = {
  '@context': 'https://schema.org', '@type': 'Person', name: 'Orlando Rasolofoniaina', jobTitle: 'AI Engineer', url: `${site}/`,
  address: { '@type': 'PostalAddress', addressLocality: 'Lyon', addressCountry: 'FR' },
  sameAs: ['https://github.com/raorla', 'https://www.linkedin.com/in/orlandoras/', 'https://lyrify.studio/'],
  knowsAbout: ['AI agents', 'LLM', 'Claude Agent SDK', 'MCP', 'TypeScript', 'Confidential computing'],
};

const langScript = `(function(){var l=null;try{l=localStorage.getItem('lang')}catch(e){}l=l||((navigator.language||'').indexOf('fr')===0?'fr':'en');document.documentElement.dataset.lang=l;document.documentElement.lang=l;try{if(localStorage.getItem('motion')==='paused')document.documentElement.classList.add('paused')}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: langScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
