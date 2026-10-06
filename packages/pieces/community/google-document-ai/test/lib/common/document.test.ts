import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_FIELD_MASK, flattenEntities, formFieldsOf, languagesOf, mimeTypeFor, parsePageSelection, splitDocumentText, summarizeDocument, tablesOf, textOf } from '../../../src/lib/common/document';

const codePointSegment = ({ text, needle }: { text: string; needle: string }) => {
  const start = [...text.slice(0, text.indexOf(needle))].length;
  return { startIndex: String(start), endIndex: String(start + [...needle].length) };
};

const TEXT = 'Nome: João\nTotal: R$ 10,50\n';
const chars = splitDocumentText(TEXT);
const seg = (needle: string) => codePointSegment({ text: TEXT, needle });

describe('mimeTypeFor()', () => {
  it('should prefer the explicit type, then the extension of any name given', () => {
    expect(mimeTypeFor({ explicit: 'image/png', names: ['x.pdf'] })).toBe('image/png');
    expect(mimeTypeFor({ explicit: undefined, names: ['invoice.PDF'] })).toBe('application/pdf');
    expect(mimeTypeFor({ explicit: undefined, names: [undefined, 'gs://b/scan.tiff'] })).toBe('image/tiff');
    expect(mimeTypeFor({ explicit: '', names: ['contract.docx'] })).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  });

  it('should keep # and ? in file names and Cloud Storage object names', () => {
    expect(mimeTypeFor({ explicit: undefined, names: ['invoice#123.pdf'] })).toBe('application/pdf');
    expect(mimeTypeFor({ explicit: undefined, names: ['scan?v2.png'] })).toBe('image/png');
    expect(mimeTypeFor({ explicit: undefined, names: ['gs://bucket/folder/x#1.tiff'] })).toBe('image/tiff');
    expect(mimeTypeFor({ explicit: undefined, names: ['gs://bucket/a?b.pdf'] })).toBe('application/pdf');
  });

  it('should ignore the query string and fragment of http(s) URLs', () => {
    expect(mimeTypeFor({ explicit: undefined, names: ['https://example.com/f.pdf?sig=abc#p2'] })).toBe('application/pdf');
    expect(mimeTypeFor({ explicit: undefined, names: ['http://example.com/dir/scan.PNG#top'] })).toBe('image/png');
  });

  it('should not read the bucket name or a dotless name as the extension', () => {
    expect(() => mimeTypeFor({ explicit: undefined, names: ['gs://bucket.pdf'] })).toThrow('fill in MIME Type');
    expect(() => mimeTypeFor({ explicit: undefined, names: ['https://example.com/pdf'] })).toThrow('fill in MIME Type');
  });

  it('should ask for the type when nothing tells it', () => {
    expect(() => mimeTypeFor({ explicit: undefined, names: ['noext', undefined] })).toThrow('fill in MIME Type');
  });
});

describe('parsePageSelection()', () => {
  it('should expand lists and ranges, dedupe and sort', () => {
    expect(parsePageSelection(' 3, 1-2, 2 ,8 ')).toEqual([1, 2, 3, 8]);
    expect(parsePageSelection('')).toBeUndefined();
    expect(parsePageSelection(undefined)).toBeUndefined();
  });

  it('should reject garbage and backwards ranges', () => {
    expect(() => parsePageSelection('1,a')).toThrow('numbers or ranges');
    expect(() => parsePageSelection('5-2')).toThrow('Invalid page range');
    expect(() => parsePageSelection('0')).toThrow('pages start at 1');
  });

  it('should stop expanding huge ranges and refuse more than 30 pages', () => {
    expect(parsePageSelection('1-30,5')).toHaveLength(30);
    expect(() => parsePageSelection('1-10000000')).toThrow('Too many pages selected: pick at most 30');
    expect(() => parsePageSelection('1-20,40-50')).toThrow('Too many pages selected');
    expect(() => parsePageSelection('1-9007199254740991')).toThrow('Too many pages selected');
  });

  it('should refuse page numbers beyond the safe integer range', () => {
    expect(() => parsePageSelection('9007199254740992')).toThrow('the page number is too large');
    expect(() => parsePageSelection('1-9007199254740992')).toThrow('the page number is too large');
    expect(() => parsePageSelection('99999999999999999999')).toThrow('the page number is too large');
  });
});

describe('textOf()', () => {
  it('should slice by Unicode code point offsets and join segments', () => {
    expect(textOf({ chars, anchor: { textSegments: [seg('João')] } })).toBe('João');
    expect(textOf({ chars, anchor: { textSegments: [seg('Nome'), seg(' 10,50')] } })).toBe('Nome 10,50');
    expect(textOf({ chars, anchor: { textSegments: [{ endIndex: '4' }] } })).toBe('Nome');
  });

  it('should read accented text at the code point offsets Document AI returns', () => {
    const accented = splitDocumentText('Nome: João');
    expect(textOf({ chars: accented, anchor: { textSegments: [{ startIndex: '6', endIndex: '10' }] } })).toBe('João');
    expect(textOf({ chars: accented, anchor: { textSegments: [{ startIndex: '6' }] } })).toBe('João');
  });

  it('should read CJK text at code point offsets', () => {
    const cjk = splitDocumentText('請求書番号: 東京123');
    expect(textOf({ chars: cjk, anchor: { textSegments: [{ startIndex: '0', endIndex: '5' }] } })).toBe('請求書番号');
    expect(textOf({ chars: cjk, anchor: { textSegments: [{ startIndex: '7', endIndex: '12' }] } })).toBe('東京123');
  });

  it('should count an emoji outside the BMP as a single code point', () => {
    const text = 'Status: 😀 OK total 9';
    const emoji = splitDocumentText(text);
    expect(textOf({ chars: emoji, anchor: { textSegments: [{ startIndex: '8', endIndex: '9' }] } })).toBe('😀');
    expect(textOf({ chars: emoji, anchor: { textSegments: [{ startIndex: '10', endIndex: '12' }] } })).toBe('OK');
    expect(textOf({ chars: emoji, anchor: { textSegments: [codePointSegment({ text, needle: 'total 9' })] } })).toBe('total 9');
  });

  it('should prefer inline content and tolerate missing anchors', () => {
    expect(textOf({ chars, anchor: { content: 'inline\n' } })).toBe('inline');
    expect(textOf({ chars, anchor: undefined })).toBe('');
    expect(textOf({ chars: [], anchor: { textSegments: [{ startIndex: '0', endIndex: '2' }] } })).toBe('');
  });
});

describe('flattenEntities()', () => {
  it('should flatten entities with normalized values, page numbers and nested properties', () => {
    const entities = flattenEntities({
      entities: [
        {
          type: 'total_amount',
          mentionText: 'R$ 10,50',
          confidence: 0.98,
          normalizedValue: { text: '10.5 BRL', moneyValue: { currencyCode: 'BRL', units: '10', nanos: 500000000 } },
          id: '1',
          pageAnchor: { pageRefs: [{ page: '0' }] },
        },
        {
          type: 'line_item',
          textAnchor: { textSegments: [seg('Total: R$ 10,50')] },
          properties: [{ type: 'line_item/amount', mentionText: '10,50', confidence: 0.7 }],
        },
        { type: 'supplier_name', mentionText: 'ACME', pageAnchor: { pageRefs: [{}] } },
      ],
      chars,
    });

    expect(entities).toEqual([
      {
        type: 'total_amount',
        mentionText: 'R$ 10,50',
        confidence: 0.98,
        normalizedText: '10.5 BRL',
        normalizedValue: { moneyValue: { currencyCode: 'BRL', units: '10', nanos: 500000000 }, text: '10.5 BRL' },
        id: '1',
        page: 1,
        properties: [],
      },
      {
        type: 'line_item',
        mentionText: 'Total: R$ 10,50',
        confidence: null,
        normalizedText: null,
        normalizedValue: null,
        id: null,
        page: null,
        properties: [{ type: 'line_item/amount', mentionText: '10,50', confidence: 0.7, normalizedText: null, normalizedValue: null, id: null, page: null, properties: [] }],
      },
      { type: 'supplier_name', mentionText: 'ACME', confidence: null, normalizedText: null, normalizedValue: null, id: null, page: 1, properties: [] },
    ]);
    expect(flattenEntities({ entities: undefined, chars })).toEqual([]);
  });
});

describe('formFieldsOf() / tablesOf() / languagesOf()', () => {
  const pages = [
    {
      pageNumber: 1,
      detectedLanguages: [{ languageCode: 'pt', confidence: 0.9 }, { languageCode: 'en', confidence: 0.2 }],
      formFields: [
        { fieldName: { textAnchor: { textSegments: [seg('Nome:')] }, confidence: 0.95 }, fieldValue: { textAnchor: { textSegments: [seg('João')] }, confidence: 0.91 }, valueType: 'text' },
      ],
      tables: [
        {
          headerRows: [{ cells: [{ layout: { textAnchor: { textSegments: [seg('Nome')] } } }, { layout: { textAnchor: { textSegments: [seg('Total')] } } }] }],
          bodyRows: [{ cells: [{ layout: { textAnchor: { textSegments: [seg('João')] } } }, { layout: { textAnchor: { textSegments: [seg('R$ 10,50')] } } }] }],
        },
      ],
    },
    { pageNumber: 2, detectedLanguages: [{ languageCode: 'pt', confidence: 0.95 }] },
  ];

  it('should resolve form fields, tables and languages to plain values', () => {
    expect(formFieldsOf({ pages, chars })).toEqual([{ page: 1, name: 'Nome:', value: 'João', nameConfidence: 0.95, valueConfidence: 0.91, valueType: 'text' }]);
    expect(tablesOf({ pages, chars })).toEqual([{ page: 1, headerRows: [['Nome', 'Total']], bodyRows: [['João', 'R$ 10,50']] }]);
    expect(languagesOf(pages)).toEqual([
      { languageCode: 'pt', confidence: 0.95 },
      { languageCode: 'en', confidence: 0.2 },
    ]);
  });

  it('summarizeDocument() should assemble the flat shape and attach the raw document only on request', () => {
    const document = { text: TEXT, mimeType: 'application/pdf', pages, entities: [{ type: 'x', mentionText: 'y' }] };

    const slim = summarizeDocument({ document, includeFull: false });
    expect(slim).toMatchObject({ text: TEXT, mimeType: 'application/pdf', pageCount: 2 });
    expect(slim.entities).toHaveLength(1);
    expect(slim.formFields).toHaveLength(1);
    expect(slim.tables).toHaveLength(1);
    expect(slim.document).toBeUndefined();

    expect(summarizeDocument({ document, includeFull: true }).document).toBe(document);
    expect(summarizeDocument({ document: undefined, includeFull: false })).toEqual({ text: '', mimeType: null, pageCount: 0, languages: [], entities: [], formFields: [], tables: [] });
    expect(DEFAULT_FIELD_MASK).toContain('pages.formFields');
  });
});

describe('summarizeDocument() with many cells', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const words = Array.from({ length: 600 }, (_, i) => `célula-${i}`);
  const bigText = `${words.join(' ')}\n`;
  const anchorFor = (word: string) => ({ textSegments: [codePointSegment({ text: bigText, needle: word })] });
  const cellsOf = (from: number) => Array.from({ length: 5 }, (_, c) => ({ layout: { textAnchor: anchorFor(words[from + c]) } }));
  const document = {
    text: bigText,
    pages: [
      {
        pageNumber: 1,
        formFields: Array.from({ length: 50 }, (_, i) => ({ fieldName: { textAnchor: anchorFor(words[500 + i]) }, fieldValue: { textAnchor: anchorFor(words[550 + i]) } })),
        tables: [{ headerRows: [{ cells: cellsOf(0) }], bodyRows: Array.from({ length: 99 }, (_, r) => ({ cells: cellsOf(5 + r * 5) })) }],
      },
    ],
    entities: Array.from({ length: 20 }, (_, i) => ({ type: 't', textAnchor: anchorFor(words[i]) })),
  };

  it('should resolve every cell, field and entity to the same text as slicing the document directly', () => {
    const summary = summarizeDocument({ document, includeFull: false });

    expect(summary.tables[0].headerRows).toEqual([words.slice(0, 5)]);
    expect(summary.tables[0].bodyRows).toEqual(Array.from({ length: 99 }, (_, r) => words.slice(5 + r * 5, 10 + r * 5)));
    expect(summary.formFields.map((f) => [f.name, f.value])).toEqual(Array.from({ length: 50 }, (_, i) => [words[500 + i], words[550 + i]]));
    expect(summary.entities.map((e) => e.mentionText)).toEqual(words.slice(0, 20));
  });

  it('should split the document text only once however many anchors it resolves', () => {
    const from = vi.spyOn(Array, 'from');

    summarizeDocument({ document, includeFull: false });
    const calls = [...from.mock.calls];
    from.mockRestore();

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([bigText]);
  });

  it('splitDocumentText() should treat a missing text as empty and keep surrogate pairs together', () => {
    expect(splitDocumentText(undefined)).toEqual([]);
    expect(splitDocumentText('ã😀')).toEqual(['ã', '😀']);
  });
});
