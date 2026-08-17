'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'What is SurajAI?',
    a: 'SurajAI is a full-stack, enterprise-grade AI workspace designed for production usage. It combines real-time response streaming, multi-modal vision, long-term memory extraction, document RAG, and Zod-validated tool automation.',
  },
  {
    q: 'How does Document RAG work in SurajAI?',
    a: 'When you upload documents (PDF, TXT, DOCX), SurajAI validates, cleans, and chunks the content before generating vector embeddings. When you ask questions, relevant chunks are retrieved and included in the AI context window with source citations.',
  },
  {
    q: 'Is my data isolated and secure?',
    a: 'Yes. SurajAI uses strict database relations, bcrypt password hashing, server-side JWT ownership verification, Helmet header protection, and rate limiting. Your data is isolated to your user account.',
  },
  {
    q: 'Does SurajAI support streaming AI responses?',
    a: 'Absolutely. SurajAI uses Server-Sent Events (SSE) to stream assistant output word-by-word with instant stop-generation capabilities.',
  },
  {
    q: 'Which AI providers are supported?',
    a: 'SurajAI features a modular provider abstraction (`AIService`) supporting Google Gemini, OpenAI GPT-4o, Anthropic Claude, or local fallback models via configuration.',
  },
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 relative bg-[#09090e]/60 border-t border-surface-border/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="mt-4 text-gray-400 text-base">
            Everything you need to know about SurajAI platform architecture.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.q}
                className="glass-card rounded-xl overflow-hidden border border-surface-border transition-colors"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-semibold text-white text-base sm:text-lg focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-brand-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-gray-300 text-sm sm:text-base leading-relaxed border-t border-surface-border/40 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
