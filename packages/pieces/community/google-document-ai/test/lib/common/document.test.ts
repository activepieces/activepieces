import { describe, expect, it } from 'vitest';

import { DEFAULT_FIELD_MASK, flattenEntities, formFieldsOf, languagesOf, mimeTypeFor, parsePageSelection, summarizeDocument, tablesOf, textOf } from '../../../src/lib/common/document';

const TEXT = 'Nome: João\nTotal: R$ 10,50\n';
const bytes = Buffer.from(TEXT, 'utf8');
const seg = (needle: string) => {
  const start = bytes.indexOf(Buffer.from(needle, 'utf8'));
  return { startIndex: String(start), endIndex: String(start + Buffer.byteLength(needle, 'utf8')) };
};

describe('mimeTypeFor()', () => {
  it('should prefer the explicit type, then the extension of any name given', () => {
    expect(mimeTypeFor({ explicit: 'image/png', names: ['x.pdf'] })).toBe('image/png');
    expect(mimeTypeFor({ explicit: undefined, names: ['invoice.PDF'] })).toBe('application/pdf');
    expect(mimeTypeFor({ explicit: undefined, names: [undefined, 'gs://b/scan.tiff?x=1'] })).toBe('image/tiff');
    expect(mimeTypeFor({ explicit: '', names: ['contract.docx'] })).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
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
});

describe('textOf()', () => {
  it('should slice by UTF-8 byte offsets and join segments', () => {
    expect(textOf({ text: TEXT, anchor: { textSegments: [seg('João')] } })).toBe('João');
    expect(textOf({ text: TEXT, anchor: { textSegments: [seg('Nome'), seg(' 10,50')] } })).toBe('Nome 10,50');
    expect(textOf({ text: TEXT, anchor: { textSegments: [{ endIndex: '4' }] } })).toBe('Nome');
  });

  it('should prefer inline content and tolerate missing anchors', () => {
    expect(textOf({ text: TEXT, anchor: { content: 'inline\n' } })).toBe('inline');
    expect(textOf({ text: TEXT, anchor: undefined })).toBe('');
    expect(textOf({ text: undefined, anchor: { textSegments: [{ startIndex: '0', endIndex: '2' }] } })).toBe('');
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
      text: TEXT,
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
    expect(flattenEntities({ entities: undefined, text: TEXT })).toEqual([]);
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
    expect(formFieldsOf({ pages, text: TEXT })).toEqual([{ page: 1, name: 'Nome:', value: 'João', nameConfidence: 0.95, valueConfidence: 0.91, valueType: 'text' }]);
    expect(tablesOf({ pages, text: TEXT })).toEqual([{ page: 1, headerRows: [['Nome', 'Total']], bodyRows: [['João', 'R$ 10,50']] }]);
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
