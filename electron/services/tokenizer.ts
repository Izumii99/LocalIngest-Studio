import { getEncoding, type Tiktoken } from 'js-tiktoken';

// ponytail: singleton cached encoder instance to avoid repetitive dictionary parsing overhead
let cachedEncoder: Tiktoken | null = null;

function getEncoder(): Tiktoken {
  if (!cachedEncoder) {
    cachedEncoder = getEncoding('cl100k_base');
  }
  return cachedEncoder;
}

/**
 * Counts precise token count for a text using cl100k_base (GPT-4 / Claude reference).
 */
export function countTokens(text: string): number {
  if (!text) return 0;
  try {
    const encoder = getEncoder();
    return encoder.encode(text).length;
  } catch {
    // Fallback approximation: ~4 characters per token if encoding fails on exotic characters
    return Math.ceil(text.length / 4);
  }
}

/**
 * Approximates tokens quickly for rough stats or calculates exact token sum.
 */
export function countTotalTokens(contents: string[]): number {
  return contents.reduce((acc, content) => acc + countTokens(content), 0);
}
