'use client';

import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Developer',
    price: '$0',
    description: 'Perfect for exploring SurajAI capabilities with standard model access.',
    features: [
      'Access to primary AI Provider',
      'Up to 50 conversations / month',
      'Basic Document RAG (10MB)',
      'Standard AI Memory storage',
      'Community support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro Workspace',
    price: '$29',
    period: '/month',
    description: 'Full workspace powers with RAG vector search, AI tools, and vision.',
    features: [
      'Unlimited high-speed streaming',
      'Unlimited Document Knowledge RAG',
      'Persistent AI Memory & controls',
      'Automated Web Search & Calculator Tools',
      'Multi-modal Vision & Voice Input',
      'Priority response SLA',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Dedicated infrastructure, custom AI models, and SLA support.',
    features: [
      'Custom LLM & Vector Store integration',
      'Single Sign-On (SSO) & SAML',
      'Dedicated MySQL cluster',
      'Custom rate limits & bandwidth',
      '24/7 Enterprise Support & SLA',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h2>
          <p className="mt-4 text-gray-400 text-base sm:text-lg">
            Choose the workspace plan that fits your intelligence needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass-card p-8 rounded-2xl flex flex-col justify-between relative ${
                plan.popular ? 'border-brand-500 shadow-xl shadow-brand-500/20 bg-brand-950/20' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-600 to-brand-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Most Popular
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="mt-2 text-sm text-gray-400">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  {plan.period && <span className="text-gray-400 text-sm">{plan.period}</span>}
                </div>

                <ul className="mt-8 space-y-4 text-sm text-gray-300">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-brand-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10">
                <Link
                  href="/app"
                  className={`w-full inline-flex justify-center items-center py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    plan.popular
                      ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30'
                      : 'glass-panel hover:bg-surface-hover text-gray-200 border border-surface-border'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
