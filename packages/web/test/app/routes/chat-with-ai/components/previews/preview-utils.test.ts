import { describe, expect, it } from 'vitest';

import {
  HastNode,
  previewUtils,
} from '@/app/routes/chat-with-ai/components/previews/preview-utils';

function cell(tagName: 'th' | 'td', text: string): HastNode {
  return {
    type: 'element',
    tagName,
    children: [{ type: 'text', value: text }],
  };
}

function row(tagName: 'th' | 'td', values: string[]): HastNode {
  return {
    type: 'element',
    tagName: 'tr',
    children: values.map((v) => cell(tagName, v)),
  };
}

const tableNode: HastNode = {
  type: 'element',
  tagName: 'table',
  children: [
    {
      type: 'element',
      tagName: 'thead',
      children: [row('th', ['Name', 'Age'])],
    },
    {
      type: 'element',
      tagName: 'tbody',
      children: [row('td', ['Alice', '30']), row('td', ['Bob', '25'])],
    },
  ],
};

describe('previewUtils.detectPreviewKind', () => {
  it('detects each language to its preview kind', () => {
    expect(previewUtils.detectPreviewKind('html', '<div>')).toBe('html');
    expect(previewUtils.detectPreviewKind('HTM', '<div>')).toBe('html');
    expect(previewUtils.detectPreviewKind('svg', '<svg></svg>')).toBe('svg');
    expect(previewUtils.detectPreviewKind('xml', '<svg></svg>')).toBe('svg');
    expect(previewUtils.detectPreviewKind('xml', '<note></note>')).toBe('code');
    expect(previewUtils.detectPreviewKind('csv', 'a,b')).toBe('csv');
    expect(previewUtils.detectPreviewKind('email', 'Subject: hi')).toBe(
      'email',
    );
    expect(previewUtils.detectPreviewKind('json', '{}')).toBe('json');
    expect(previewUtils.detectPreviewKind('markdown', '# Hi')).toBe('markdown');
    expect(previewUtils.detectPreviewKind('md', '# Hi')).toBe('markdown');
    expect(previewUtils.detectPreviewKind('mermaid', 'graph')).toBe('mermaid');
    expect(previewUtils.detectPreviewKind('python', 'print()')).toBe('code');
    expect(previewUtils.detectPreviewKind('', 'x')).toBe('code');
  });
});

describe('previewUtils.extractTableFromNode', () => {
  it('extracts headers and rows from a hast table node', () => {
    expect(previewUtils.extractTableFromNode(tableNode)).toEqual({
      headers: ['Name', 'Age'],
      rows: [
        ['Alice', '30'],
        ['Bob', '25'],
      ],
    });
  });

  it('returns null when there are no rows', () => {
    expect(
      previewUtils.extractTableFromNode({ type: 'element', tagName: 'div' }),
    ).toBeNull();
  });
});

describe('previewUtils.parseCsv', () => {
  it('parses csv into headers and rows', () => {
    expect(previewUtils.parseCsv('Name,Age\nAlice,30\nBob,25')).toEqual({
      headers: ['Name', 'Age'],
      rows: [
        ['Alice', '30'],
        ['Bob', '25'],
      ],
    });
  });

  it('returns null for empty input', () => {
    expect(previewUtils.parseCsv('   ')).toBeNull();
  });
});

describe('previewUtils.languageToExtension', () => {
  it('maps known languages and falls back safely', () => {
    expect(previewUtils.languageToExtension('typescript')).toBe('ts');
    expect(previewUtils.languageToExtension('python')).toBe('py');
    expect(previewUtils.languageToExtension('zig')).toBe('zig');
    expect(previewUtils.languageToExtension('not a lang!')).toBe('txt');
  });
});

describe('previewUtils csv/tsv builders', () => {
  it('builds csv and tsv from table data', () => {
    const table = { headers: ['A', 'B'], rows: [['1', '2']] };
    expect(previewUtils.buildCsv(table)).toBe('A,B\r\n1,2');
    expect(previewUtils.buildTsv(table)).toBe('A\tB\n1\t2');
  });
});

describe('previewUtils.parseJsonSafe', () => {
  it('returns parsed value or failure', () => {
    expect(previewUtils.parseJsonSafe('{"a":1}')).toEqual({
      ok: true,
      value: { a: 1 },
    });
    expect(previewUtils.parseJsonSafe('{bad}')).toEqual({ ok: false });
  });
});

describe('previewUtils.detectFileKind', () => {
  it('detects by media type', () => {
    expect(previewUtils.detectFileKind('image/png', 'a.png')).toBe('image');
    expect(previewUtils.detectFileKind('image/svg+xml', 'a.svg')).toBe('image');
    expect(previewUtils.detectFileKind('text/html', 'a.html')).toBe('html');
    expect(previewUtils.detectFileKind('text/csv', 'a.csv')).toBe('csv');
    expect(
      previewUtils.detectFileKind('text/tab-separated-values', 'a.tsv'),
    ).toBe('csv');
    expect(previewUtils.detectFileKind('application/json', 'a.json')).toBe(
      'json',
    );
    expect(previewUtils.detectFileKind('text/markdown', 'a.md')).toBe(
      'markdown',
    );
    expect(previewUtils.detectFileKind('text/plain', 'a.txt')).toBe('text');
    expect(previewUtils.detectFileKind('application/pdf', 'a.pdf')).toBe(
      'binary',
    );
  });

  it('falls back to the file extension when media type is generic', () => {
    const octet = 'application/octet-stream';
    expect(previewUtils.detectFileKind(octet, 'report.csv')).toBe('csv');
    expect(previewUtils.detectFileKind(octet, 'page.html')).toBe('html');
    expect(previewUtils.detectFileKind(octet, 'data.json')).toBe('json');
    expect(previewUtils.detectFileKind(octet, 'notes.md')).toBe('markdown');
    expect(previewUtils.detectFileKind(octet, 'archive.zip')).toBe('binary');
  });
});

describe('previewUtils.isLikelyDocument', () => {
  it('treats a titled multi-section article as a document', () => {
    const article = `# Donald Trump\n\n## Early life\n\n${'x'.repeat(
      400,
    )}\n\n## Career\n\nmore text`;
    expect(previewUtils.isLikelyDocument(article)).toBe(true);
  });

  it('does not treat short or non-titled replies as documents', () => {
    expect(previewUtils.isLikelyDocument('Sure, here is the answer.')).toBe(
      false,
    );
    expect(previewUtils.isLikelyDocument('# Hi\n\njust a line')).toBe(false);
    expect(
      previewUtils.isLikelyDocument(
        `Here are your flows:\n\n## Section\n${'y'.repeat(500)}`,
      ),
    ).toBe(false);
  });
});

describe('previewUtils.baseFileName', () => {
  it('strips the extension', () => {
    expect(previewUtils.baseFileName('Q3-report.csv')).toBe('Q3-report');
    expect(previewUtils.baseFileName('my.file.name.json')).toBe('my.file.name');
    expect(previewUtils.baseFileName('noext')).toBe('noext');
  });
});
