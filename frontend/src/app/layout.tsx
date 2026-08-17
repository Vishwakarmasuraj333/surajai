import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'SurajAI — Your Intelligent AI Workspace',
  description: 'Production-grade AI SaaS workspace powered by real multi-model intelligence, document RAG, persistent AI memory, and tool automation.',
  keywords: ['AI', 'SaaS', 'Workspace', 'RAG', 'Machine Learning', 'SurajAI', 'Chatbot', 'LLM'],
  authors: [{ name: 'SurajAI Engineering' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#07070a] text-gray-100 antialiased selection:bg-brand-600 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
