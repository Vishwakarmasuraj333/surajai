'use client';

import { motion } from 'framer-motion';
import { Database, Brain, Wrench, Eye, Mic, ShieldCheck, Zap, Layers } from 'lucide-react';

const features = [
  {
    icon: Database,
    title: 'Knowledge RAG System',
    description: 'Upload PDF, TXT, or DOCX files. Automatic vector embeddings enable accurate vector search and grounded source attribution.',
    id: 'rag',
  },
  {
    icon: Brain,
    title: 'Long-Term AI Memory',
    description: 'SurajAI continuously learns communication preferences and workflow goals without storing sensitive credentials.',
    id: 'memory',
  },
  {
    icon: Wrench,
    title: 'Automated AI Tools',
    description: 'Safely execute calculator, web search, weather, and custom Zod-validated function calls with active tool tracking.',
    id: 'tools',
  },
  {
    icon: Eye,
    title: 'Multi-Modal Vision',
    description: 'Inspect screenshots, code diagrams, and complex UI mockups directly with multi-modal AI vision capabilities.',
  },
  {
    icon: Mic,
    title: 'Voice Interface',
    description: 'Seamless hands-free interaction powered by speech-to-text audio input and text-to-speech engine playback.',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Security',
    description: 'Strict user data isolation, server-side JWT authentication, rate limiting, and password hashing using bcrypt.',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 relative bg-[#09090e]/60 border-y border-surface-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered for <span className="gradient-text">Real AI Performance</span>
          </h2>
          <p className="mt-4 text-gray-400 text-base sm:text-lg">
            Every feature in SurajAI is built with real production architecture, modular provider abstractions, and strict security controls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                id={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-card p-8 rounded-2xl relative group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-6 group-hover:scale-110 group-hover:bg-brand-500/20 transition-all duration-200">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
