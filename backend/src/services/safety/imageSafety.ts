// imageSafety.ts — Image prompt safety validation and normalization

import { ImageSafetyResult } from './safety.types.js';

// ─── Blocked image prompt patterns ───────────────────────────────────────────

const BLOCKED_IMAGE_PATTERNS = [
  // Explicit sexual content
  /\b(porn|pornography|xxx|hentai)\b/i,
  /\b(nude|naked|topless|bottomless)\s*(woman|man|girl|boy|person|model|body|photo|image)\b/i,
  /\bexplicit\s+(sex|nude|naked|content|image|photo)\b/i,
  /\bsexual\s+(act|pose|content|intercourse|fantasy)\b/i,
  /\b(erotic|erotica)\b/i,
  /\b(lingerie|underwear|bikini)\s*(model|shoot|photo|girl|woman)\b/i,
  /\bsexual\s+(minor|child|teen|underage)\b/i,
  /\b(loli|lolita|shota)\b/i,
  /\bcsam\b/i,
  /\b(fetish|bdsm|bondage)\b/i,
  /\bnon-consensual\b/i,

  // Jailbreak / bypass attempts
  /\b(nsfw|18\+|adult\s+only)\b/i,
  /\buncensored\b/i,
  /\bno\s+(restrictions|filter|safety|censorship)\b/i,
  /\bignore\s+(guidelines|rules|safety)\b/i,
  /\bprompt\s+injection\b/i,
  /\bjailbreak\b/i,

  // Euphemisms for sexual content
  /\bare(a|s)\s+visible\b/i,
  /\bwithout\s+(clothes|clothing|shirt|underwear)\b/i,
  /\bno\s+(clothes|clothing)\b/i,
  /\bfully\s+(naked|nude|exposed)\b/i,
];

// ─── Spiritual / Religious figure detection ────────────────────────────────

const HINDU_DEITY_PATTERNS: Array<[RegExp, string]> = [
  [/\b(lord\s+)?shiva\b/i, 'Lord Shiva'],
  [/\b(lord\s+)?krishna\b/i, 'Lord Krishna'],
  [/\b(lord\s+)?rama?\b/i, 'Lord Rama'],
  [/\b(lord\s+)?hanuman\b/i, 'Lord Hanuman'],
  [/\b(lord\s+)?ganesh(a)?\b/i, 'Lord Ganesha'],
  [/\b(lord\s+)?vishnu\b/i, 'Lord Vishnu'],
  [/\b(lord\s+)?brahma\b/i, 'Lord Brahma'],
  [/\b(goddess\s+)?durga\b/i, 'Goddess Durga'],
  [/\b(goddess\s+)?lakshmi\b/i, 'Goddess Lakshmi'],
  [/\b(goddess\s+)?saraswati\b/i, 'Goddess Saraswati'],
  [/\b(goddess\s+)?kali\b/i, 'Goddess Kali'],
  [/\b(goddess\s+)?parvati\b/i, 'Goddess Parvati'],
  [/\b(lord\s+)?indra\b/i, 'Lord Indra'],
  [/\b(lord\s+)?surya\b/i, 'Lord Surya'],
];

const OTHER_RELIGIOUS_PATTERNS: Array<[RegExp, string]> = [
  [/\bjesus(\s+christ)?\b/i, 'Jesus Christ'],
  [/\bvirgin\s+mary\b/i, 'Virgin Mary'],
  [/\bprophet\s+muhammad\b/i, 'Prophet Muhammad'],
  [/\bbuddha\b/i, 'Gautama Buddha'],
  [/\bguru\s+nanak\b/i, 'Guru Nanak'],
];

// ─── Subject normalization rules ──────────────────────────────────────────────

type NormalizationRule = {
  detect: RegExp;
  normalize: (original: string) => string;
};

const NORMALIZATION_RULES: NormalizationRule[] = [
  // Person / portrait
  {
    detect: /\b(beautiful\s+)?(woman|girl|female|lady)\b/i,
    normalize: (orig) =>
      orig.replace(
        /\b(beautiful\s+)?(woman|girl|female|lady)\b/gi,
        'professional adult woman'
      ) +
      ', fully clothed, natural professional pose, tasteful composition, cinematic lighting, respectful presentation',
  },
  {
    detect: /\b(handsome\s+)?(man|guy|male|boy)\b/i,
    normalize: (orig) =>
      orig.replace(
        /\b(handsome\s+)?(man|guy|male|boy)\b/gi,
        'professional adult man'
      ) +
      ', fully clothed, natural professional pose, tasteful composition, cinematic lighting, respectful presentation',
  },
  // Model / fashion
  {
    detect: /\b(fashion\s+)?(model|portrait)\b/i,
    normalize: (orig) =>
      orig + ', fully clothed, professional studio lighting, editorial style, natural pose, tasteful composition',
  },
  // Developer / programmer
  {
    detect: /\b(software\s+)?(developer|programmer|coder|engineer)\b/i,
    normalize: (orig) =>
      orig +
      ', professional attire, modern office or workspace setting, laptop, realistic portrait, cinematic professional lighting',
  },
  // Student
  {
    detect: /\bstudent\b/i,
    normalize: (orig) =>
      orig + ', fully clothed, campus setting, natural pose, realistic portrait, soft cinematic lighting',
  },
  // Artist / creative
  {
    detect: /\bartist\b/i,
    normalize: (orig) =>
      orig + ', professional creative setting, fully clothed, natural pose, warm cinematic lighting',
  },
];

// ─── Main Safety Check + Normalization ───────────────────────────────────────

export class ImageSafetyService {
  /**
   * Check if an image prompt is safe.
   * Returns safe: false with a reason for blocked content.
   */
  static checkPrompt(prompt: string): ImageSafetyResult {
    for (const pattern of BLOCKED_IMAGE_PATTERNS) {
      if (pattern.test(prompt)) {
        return {
          safe: false,
          category: 'sexual',
          normalizedPrompt: prompt,
          reason:
            "⚠️ I can't create explicit or sexual imagery.\n\nI can help create a safe, professional alternative such as:\n• Professional portrait\n• Cinematic character artwork\n• Fashion editorial\n• Devotional spiritual artwork\n• Fantasy character art\n• Professional photography style",
        };
      }
    }

    return {
      safe: true,
      category: 'ok',
      normalizedPrompt: ImageSafetyService.normalizePrompt(prompt),
    };
  }

  /**
   * Normalize a user image prompt to a safe, professional internal prompt.
   * Applied AFTER the safety check passes.
   */
  static normalizePrompt(prompt: string): string {
    let normalized = prompt.trim();

    // 1. Handle Hindu deities
    for (const [pattern, name] of HINDU_DEITY_PATTERNS) {
      if (pattern.test(normalized)) {
        return (
          `Respectful devotional artistic depiction of ${name}, ` +
          `traditional iconography, serene and divine expression, sacred atmospheric setting, ` +
          `detailed traditional ornaments and attire, cinematic spiritual lighting, ` +
          `non-sexual respectful composition, high quality digital painting`
        );
      }
    }

    // 2. Handle other religious figures
    for (const [pattern, name] of OTHER_RELIGIOUS_PATTERNS) {
      if (pattern.test(normalized)) {
        return (
          `Respectful artistic depiction of ${name}, ` +
          `traditional and reverent style, dignified expression, sacred setting, ` +
          `cinematic spiritual lighting, respectful composition, high quality digital art`
        );
      }
    }

    // 3. Apply subject normalization rules
    for (const rule of NORMALIZATION_RULES) {
      if (rule.detect.test(normalized)) {
        normalized = rule.normalize(normalized);
        break; // Apply first matching rule only
      }
    }

    // 4. Always append general safety suffix if not already present
    const safetyTags = ['photorealistic', 'cinematic', 'high quality', 'professional', 'tasteful'];
    const hasSafetyTag = safetyTags.some((tag) =>
      normalized.toLowerCase().includes(tag)
    );

    if (!hasSafetyTag) {
      normalized += ', photorealistic, high quality, professional composition';
    }

    return normalized;
  }

  /**
   * Check if generated output image is safe to expose to user.
   */
  static checkImageOutput(meta?: { storageKey?: string; mimeType?: string }): { safe: boolean; reason?: string } {
    // If output metadata fails validation or is flagged as unsafe
    if (meta && meta.mimeType && !meta.mimeType.startsWith('image/')) {
      return {
        safe: false,
        reason: "⚠️ The generated result could not be shown because it didn't meet SurajAI's safety requirements.",
      };
    }

    return { safe: true };
  }
}

