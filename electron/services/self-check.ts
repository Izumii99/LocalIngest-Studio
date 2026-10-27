import assert from 'node:assert';
import { countTokens } from './tokenizer.ts';
import { formatOutput, generateAsciiTree } from './formatter.ts';
import type { FileNode } from '../../src/types/index.ts';

// 1. Check tokenizer
const tokens = countTokens('console.log("Hello LocalIngest Studio!");');
assert.ok(tokens > 0, 'Tokenizer should return positive token count');
console.log(`[PASS] Tokenizer self-check: ${tokens} tokens`);

// 2. Check ASCII tree generation
const mockTree: FileNode = {
  id: '/',
  name: 'root',
  path: '/root',
  relativePath: '',
  isDirectory: true,
  children: [
    {
      id: 'src',
      name: 'src',
      path: '/root/src',
      relativePath: 'src',
      isDirectory: true,
      children: [
        {
          id: 'src/main.ts',
          name: 'main.ts',
          path: '/root/src/main.ts',
          relativePath: 'src/main.ts',
          isDirectory: false,
          size: 100,
        },
      ],
    },
    {
      id: 'package.json',
      name: 'package.json',
      path: '/root/package.json',
      relativePath: 'package.json',
      isDirectory: false,
      size: 50,
    },
  ],
};

const ascii = generateAsciiTree(mockTree);
assert.ok(ascii.includes('src/'), 'Ascii tree should include folder');
assert.ok(ascii.includes('main.ts'), 'Ascii tree should include child file');
console.log('[PASS] ASCII Tree self-check');

// 3. Check XML format with Secret Redaction and Max File Size
const xml = formatOutput(
  [
    { relativePath: 'src/main.ts', content: 'const apiKey = "sk-proj-abc1234567890abcdef1234567890";', size: 100 },
    { relativePath: 'src/large.json', content: '{"data": "very large"}', size: 200 * 1024 }, // 200 KB
  ],
  {
    format: 'xml',
    systemPrompt: 'You are an AI assistant.',
    includeAsciiTree: true,
    treeRoot: mockTree,
    maxFileSizeKB: 100,
    redactSecrets: true,
  }
);

assert.ok(xml.includes('<instructions>'), 'XML must include <instructions>');
assert.ok(xml.includes('<file path="src/main.ts">'), 'XML must include file tags');
assert.ok(xml.includes('[REDACTED_SECRET]'), 'Secret should be redacted when redactSecrets is true');
assert.ok(xml.includes('[Content omitted: File size'), 'Large file should have content omitted when exceeding max limit');
console.log('[PASS] XML Formatter with Redaction & MaxSize self-check');

console.log('All engine self-checks passed successfully!');
