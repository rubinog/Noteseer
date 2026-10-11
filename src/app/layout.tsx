import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Noteseer - AI-Powered Bookmarks & Notes',
  description: 'Applicazione personale e self-hosted per salvare, organizzare e leggere link, articoli e note con intelligenza artificiale locale e ricerca full-text istantanea.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔖</text></svg>',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
