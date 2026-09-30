import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'NETRA SHAKTI // TRACE THE ORIGIN, PROVE THE TRUTH',
  description: 'National DEFENCE Document Distribution & Cryptographic Decryption Provenance Platform'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-cyber-black text-gray-100 min-h-screen antialiased cyber-grid">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
