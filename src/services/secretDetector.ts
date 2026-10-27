import type { SecretFinding } from '../types/index.ts';

const SECRET_PATTERNS: { name: string; regex: RegExp }[] = [
  {
    name: 'OpenAI API Key',
    regex: /\bsk-[a-zA-Z0-9_-]{24,}\b/g,
  },
  {
    name: 'Anthropic API Key',
    regex: /\bsk-ant-[a-zA-Z0-9_-]{24,}\b/g,
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /\b(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}\b/g,
  },
  {
    name: 'AWS Access Key ID',
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    name: 'Private Key Header',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    name: 'Generic API Key / Secret String',
    regex: /(?:api_key|apikey|access_token|secret_key|auth_token|client_secret)\s*[:=]\s*["']([A-Za-z0-9_\-.~+=]{16,})["']/gi,
  },
];

/**
 * Scans a map of filePath -> content for known secrets.
 */
export function scanForSecrets(filesContent: Record<string, string>): SecretFinding[] {
  const findings: SecretFinding[] = [];

  for (const [filePath, content] of Object.entries(filesContent)) {
    if (!content || content.startsWith('[Error reading file:') || content.startsWith('[Content omitted:')) {
      continue;
    }

    const lines = content.split('\n');
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const lineText = lines[lineIdx];

      for (const pattern of SECRET_PATTERNS) {
        // Reset regex state
        pattern.regex.lastIndex = 0;
        const match = pattern.regex.exec(lineText);
        if (match) {
          const rawMatch = match[0];
          // Truncate snippet for privacy in findings
          const snippet = rawMatch.length > 20 ? `${rawMatch.slice(0, 10)}...${rawMatch.slice(-4)}` : rawMatch;

          findings.push({
            filePath,
            type: pattern.name,
            matchSnippet: snippet,
            line: lineIdx + 1,
          });
          // Match at most one secret per line to prevent flood
          break;
        }
      }
    }
  }

  return findings;
}

/**
 * Redacts known secrets in the merged output.
 */
export function redactSecretsFromContent(content: string): string {
  let redacted = content;
  for (const pattern of SECRET_PATTERNS) {
    pattern.regex.lastIndex = 0;
    redacted = redacted.replace(pattern.regex, '[REDACTED_SECRET]');
  }
  return redacted;
}
