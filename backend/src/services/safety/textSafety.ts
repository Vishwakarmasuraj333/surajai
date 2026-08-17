// textSafety.ts — Input/Output safety checks for chat text requests

import { SafetyResult } from './safety.types.js';

// ─── Blocked patterns for text requests ───────────────────────────────────────

const SEXUAL_PATTERNS = [
  /\bporn(ography)?\b/i,
  /\bsexual\s+(act|content|exploit)/i,
  /\bexplicit\s+(sex|nude|naked|content)/i,
  /\b(nude|naked)\s+(photo|image|picture|video|content)\b/i,
  /\bchild\s+(sex|nude|naked|exploit|abuse|porn)\b/i,
  /\bcsam\b/i,
  /\bcp\s+(image|content|video)\b/i,
  /\bsexual\s+content\s+involving\s+(minor|child|kid|teen)\b/i,
  /\bgenerate\s+(nude|naked|explicit|porn)\b/i,
  /\bwrite\s+(erotica|sexual|porn)\b/i,
];

const HARMFUL_PATTERNS = [
  /\bhow\s+to\s+(make|build|create|synthesize)\s+(bomb|weapon|explosive|meth|drugs)\b/i,
  /\bstep.by.step\s+(bomb|kill|attack|hack\s+account)\b/i,
  /\b(bioweapon|chemical\s+weapon|nerve\s+agent)\b/i,
  /\bhow\s+to\s+(stalk|track\s+someone\s+without)\b/i,
];

const JAILBREAK_PATTERNS = [
  /\bignore\s+(all\s+)?(previous|prior|above)\s+(instructions|rules|guidelines|constraints)\b/i,
  /\bact\s+as\s+(dan|jailbreak|uncensored|evil|unrestricted)\b/i,
  /\byou\s+are\s+now\s+(uncensored|unrestricted|jailbroken|dan)\b/i,
  /\bpretend\s+(you\s+have\s+no\s+)?(restrictions|guidelines|rules|ethics)\b/i,
  /\bbypass\s+(safety|filter|restriction|guideline)\b/i,
  /\bdo\s+anything\s+now\b/i,
  /\bnsfw\s+mode\b/i,
];

// ─── Text Safety Service ──────────────────────────────────────────────────────

export class TextSafetyService {
  /**
   * Check if a user text message is safe to process.
   * Returns safe: true for normal requests.
   */
  static check(text: string): SafetyResult {
    for (const pattern of SEXUAL_PATTERNS) {
      if (pattern.test(text)) {
        return {
          safe: false,
          category: 'sexual',
          reason:
            "⚠️ I can't help with explicit or sexual content requests. I'm here to assist with coding, learning, creative projects, and professional tasks.",
        };
      }
    }

    for (const pattern of HARMFUL_PATTERNS) {
      if (pattern.test(text)) {
        return {
          safe: false,
          category: 'harmful',
          reason:
            "⚠️ I can't assist with requests that could cause harm. I'm here to help with safe, constructive tasks.",
        };
      }
    }

    for (const pattern of JAILBREAK_PATTERNS) {
      if (pattern.test(text)) {
        return {
          safe: false,
          category: 'jailbreak',
          reason:
            "⚠️ I operate with consistent safety guidelines that ensure I'm helpful, accurate, and professional. Let me know what I can actually help you with!",
        };
      }
    }

    return { safe: true, category: 'ok' };
  }

  /**
   * Check if AI generated output text meets safety standards.
   */
  static checkOutput(text: string): SafetyResult {
    for (const pattern of SEXUAL_PATTERNS) {
      if (pattern.test(text)) {
        return {
          safe: false,
          category: 'sexual',
          reason: "⚠️ The response was blocked because it didn't meet SurajAI's safety requirements.",
        };
      }
    }

    for (const pattern of HARMFUL_PATTERNS) {
      if (pattern.test(text)) {
        return {
          safe: false,
          category: 'harmful',
          reason: "⚠️ The response was blocked because it contains harmful content.",
        };
      }
    }

    return { safe: true, category: 'ok' };
  }
}

