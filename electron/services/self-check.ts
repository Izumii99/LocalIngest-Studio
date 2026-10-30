import assert from 'node:assert';
import { countTokens } from './tokenizer.ts';
import { formatOutput, generateAsciiTree, splitOutputIntoParts } from './formatter.ts';
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

// 4. Check Diet Mode (Asset & Inline SVG / Base64 pruning)
const dietSample = `
const icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" fill="#fff" stroke="#000" stroke-width="2"/></svg>';
const img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
`;

const dietOutput = formatOutput(
  [{ relativePath: 'src/assets.ts', content: dietSample, size: 400 }],
  {
    format: 'xml',
    dietMode: true,
  }
);
assert.ok(dietOutput.includes('<!-- [LocalIngest: SVG body omitted,'), 'Diet mode should prune large inline SVG bodies');
assert.ok(dietOutput.includes('[OMITTED_BY_LOCALINGEST_'), 'Diet mode should prune large Base64 data URIs');
console.log('[PASS] Diet Mode (Asset & SVG / Base64 pruning) self-check');

// 5. Check Multi-Part Split Ingest
const splitFiles = [
  { relativePath: 'src/file1.ts', content: 'const a = "'.padEnd(500, 'x') + '";', size: 500 },
  { relativePath: 'src/file2.ts', content: 'const b = "'.padEnd(500, 'y') + '";', size: 500 },
];
const splitParts = splitOutputIntoParts(splitFiles, { format: 'xml' }, 'myproject', 400);
assert.strictEqual(splitParts.length, 2, 'Should split into 2 parts when exceeding maxPartBytes');
assert.strictEqual(splitParts[0].partIndex, 1);
assert.strictEqual(splitParts[0].totalParts, 2);
assert.ok(splitParts[0].content.includes('<part current="1" total="2" />'), 'Part 1 must include manifest part info');
assert.ok(splitParts[0].content.includes('<next_part>myproject-part2.xml</next_part>'), 'Part 1 must link to part 2');
assert.ok(splitParts[1].content.includes('<continuation_of>myproject-part1.xml</continuation_of>'), 'Part 2 must reference part 1');
console.log('[PASS] Multi-Part Split Ingest & Manifest Linker self-check');

// 6. Check Preferences Normalization logic
function normalizePreferences(raw: any) {
  return {
    recentFolders: Array.isArray(raw?.recentFolders) ? raw.recentFolders : [],
    maxFileSizeKB: typeof raw?.maxFileSizeKB === 'number' && raw.maxFileSizeKB > 0 ? raw.maxFileSizeKB : 100,
    lastOpenedFolder: typeof raw?.lastOpenedFolder === 'string' && raw.lastOpenedFolder.trim() ? raw.lastOpenedFolder.trim() : undefined,
    fileSelectionCache: raw?.fileSelectionCache && typeof raw.fileSelectionCache === 'object' && !Array.isArray(raw.fileSelectionCache) ? raw.fileSelectionCache : {},
    dietMode: typeof raw?.dietMode === 'boolean' ? raw.dietMode : true,
  };
}

const defaultPrefs = normalizePreferences({});
assert.strictEqual(defaultPrefs.maxFileSizeKB, 100, 'Default maxFileSizeKB must be 100');
assert.deepStrictEqual(defaultPrefs.recentFolders, [], 'Default recentFolders must be empty array');
assert.strictEqual(defaultPrefs.lastOpenedFolder, undefined, 'Default lastOpenedFolder must be undefined');
assert.deepStrictEqual(defaultPrefs.fileSelectionCache, {}, 'Default fileSelectionCache must be empty object');
assert.strictEqual(defaultPrefs.dietMode, true, 'Default dietMode must be true');

const customPrefs = normalizePreferences({
  recentFolders: ['/path/to/repo'],
  maxFileSizeKB: 1000,
  lastOpenedFolder: '/path/to/repo',
  fileSelectionCache: { '/path/to/repo': ['src/main.ts'] },
  dietMode: false,
});
assert.strictEqual(customPrefs.maxFileSizeKB, 1000, 'Custom maxFileSizeKB must be preserved');
assert.strictEqual(customPrefs.recentFolders.length, 1, 'Custom recentFolders must be preserved');
assert.strictEqual(customPrefs.lastOpenedFolder, '/path/to/repo', 'Custom lastOpenedFolder must be preserved');
assert.deepStrictEqual(customPrefs.fileSelectionCache['/path/to/repo'], ['src/main.ts'], 'File selection cache must be preserved');
assert.strictEqual(customPrefs.dietMode, false, 'Custom dietMode must be preserved');
console.log('[PASS] Preferences Normalization self-check (including lastOpenedFolder, fileSelectionCache, and dietMode)');

console.log('All engine self-checks passed successfully!');
