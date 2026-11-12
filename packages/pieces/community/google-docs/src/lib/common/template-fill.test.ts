import { docs_v1 } from '@googleapis/docs';
import { describe, expect, it } from 'vitest';
import { templateFill } from './template-fill';

describe('templateFill.resolveFormat', () => {
  it('maps the dropdown identifiers', () => {
    expect(templateFill.resolveFormat('curly_braces')).toBe('{{KEY}}');
    expect(templateFill.resolveFormat('square_brackets')).toBe('[[KEY]]');
    expect(templateFill.resolveFormat('single_curly')).toBe('{KEY}');
    expect(templateFill.resolveFormat('single_square')).toBe('[KEY]');
  });

  it('still accepts the raw formats saved by old flows', () => {
    expect(templateFill.resolveFormat('{{KEY}}')).toBe('{{KEY}}');
    expect(templateFill.resolveFormat('[KEY]')).toBe('[KEY]');
  });

  it('falls back to double square brackets', () => {
    expect(templateFill.resolveFormat(undefined)).toBe('[[KEY]]');
    expect(templateFill.resolveFormat('nonsense')).toBe('[[KEY]]');
  });
});

describe('templateFill.scan', () => {
  it('lists each placeholder once, in document order', () => {
    const scan = templateFill.scan({
      document: singleTab([paragraph('Dear {{name}}, your order {{order_id}} is ready, {{name}}.')]),
      format: '{{KEY}}',
    });

    expect(scan.placeholders).toEqual([
      { key: 'name', tokens: ['{{name}}'] },
      { key: 'order_id', tokens: ['{{order_id}}'] },
    ]);
  });

  it('joins a placeholder that Google split across text runs', () => {
    const scan = templateFill.scan({
      document: singleTab([paragraph('Hi {{na', 'me}}')]),
      format: '{{KEY}}',
    });

    expect(scan.placeholders).toEqual([{ key: 'name', tokens: ['{{name}}'] }]);
  });

  it('groups spacing variants of one placeholder under its trimmed name', () => {
    const scan = templateFill.scan({
      document: singleTab([paragraph('{{ name }} and {{name}}')]),
      format: '{{KEY}}',
    });

    expect(scan.placeholders).toEqual([{ key: 'name', tokens: ['{{ name }}', '{{name}}'] }]);
  });

  it('reads tables, headers, footers and footnotes', () => {
    const scan = templateFill.scan({
      document: {
        tabs: [
          {
            tabProperties: { tabId: 't.0' },
            documentTab: {
              body: { content: [table([[paragraph('[[cell]]')]])] },
              headers: { h1: { content: [paragraph('[[header]]')] } },
              footers: { f1: { content: [paragraph('[[footer]]')] } },
              footnotes: { n1: { content: [paragraph('[[note]]')] } },
            },
          },
        ],
      },
      format: '[[KEY]]',
    });

    expect(scan.placeholders.map((placeholder) => placeholder.key)).toEqual(['cell', 'header', 'footer', 'note']);
  });

  it('reads every tab, including child tabs', () => {
    const scan = templateFill.scan({
      document: {
        tabs: [
          {
            tabProperties: { tabId: 't.0' },
            documentTab: { body: { content: [paragraph('{{first}}')] } },
            childTabs: [
              {
                tabProperties: { tabId: 't.1' },
                documentTab: { body: { content: [paragraph('{{child}}')] } },
              },
            ],
          },
        ],
      },
      format: '{{KEY}}',
    });

    expect(scan.placeholders.map((placeholder) => placeholder.key)).toEqual(['first', 'child']);
  });

  it('reads a document returned without tabs', () => {
    const scan = templateFill.scan({
      document: { body: { content: [paragraph('{{legacy}}')] } },
      format: '{{KEY}}',
    });

    expect(scan.placeholders).toEqual([{ key: 'legacy', tokens: ['{{legacy}}'] }]);
  });

  it('does not read the inside of a double bracket as a single bracket placeholder', () => {
    const scan = templateFill.scan({
      document: singleTab([paragraph('{{double}} {single} [[double2]] [single2]')]),
      format: '{KEY}',
    });

    expect(scan.placeholders).toEqual([{ key: 'single', tokens: ['{single}'] }]);
  });

  it('ignores empty brackets', () => {
    const scan = templateFill.scan({
      document: singleTab([paragraph('{{}} {{  }} {{ok}}')]),
      format: '{{KEY}}',
    });

    expect(scan.placeholders).toEqual([{ key: 'ok', tokens: ['{{ok}}'] }]);
  });

  it('lists images in document order with their alt text', () => {
    const scan = templateFill.scan({
      document: {
        tabs: [
          {
            tabProperties: { tabId: 't.0' },
            documentTab: {
              body: { content: [paragraphWithImage('kix.b'), paragraphWithImage('kix.a')] },
              inlineObjects: {
                'kix.a': image({ title: 'Signature' }),
                'kix.b': image({ description: 'Company logo' }),
                'kix.c': { inlineObjectProperties: { embeddedObject: { embeddedDrawingProperties: {} } } },
              },
            },
          },
        ],
      },
      format: '{{KEY}}',
    });

    expect(scan.images).toEqual([
      { objectId: 'kix.b', title: '', description: 'Company logo', tabId: 't.0', inFirstTab: true },
      { objectId: 'kix.a', title: 'Signature', description: '', tabId: 't.0', inFirstTab: true },
    ]);
  });
});

describe('templateFill.scan floating images', () => {
  it('lists a floating image in document order and finds it by alt text', () => {
    const scan = templateFill.scan({
      document: {
        tabs: [
          {
            tabProperties: { tabId: 't.0' },
            documentTab: {
              body: {
                content: [
                  paragraphWithImage('kix.inline'),
                  { paragraph: { elements: [{ textRun: { content: 'text' } }], positionedObjectIds: ['kix.float'] } },
                ],
              },
              inlineObjects: { 'kix.inline': image({ title: 'Logo' }) },
              positionedObjects: {
                'kix.float': {
                  positionedObjectProperties: { embeddedObject: { description: 'Stamp', imageProperties: {} } },
                },
                'kix.drawing': { positionedObjectProperties: { embeddedObject: {} } },
              },
            },
          },
        ],
      },
      format: '{{KEY}}',
    });

    expect(scan.images.map((found) => found.objectId)).toEqual(['kix.inline', 'kix.float']);
    expect(scan.otherObjects.map((found) => found.objectId)).toEqual(['kix.drawing']);
    expect(
      templateFill.plan({
        scan,
        format: '{{KEY}}',
        images: [{ imageObjectId: 'stamp', url: 'https://example.com/s.png' }],
      }).requests,
    ).toEqual([{ replaceImage: { imageObjectId: 'kix.float', uri: 'https://example.com/s.png' } }]);
  });
});

describe('templateFill.plan', () => {
  it('builds the same request as before for a plain key', () => {
    const plan = templateFill.plan({
      scan: templateFill.scan({ document: singleTab([paragraph('Hi [[name]]')]), format: '[[KEY]]' }),
      format: '[[KEY]]',
      values: { name: 'Ada' },
    });

    expect(plan.requests).toEqual([
      { replaceAllText: { containsText: { text: '[[name]]', matchCase: true }, replaceText: 'Ada' } },
    ]);
  });

  it('keeps sending a key the scan did not see', () => {
    const plan = templateFill.plan({
      scan: templateFill.scan({ document: singleTab([paragraph('nothing here')]), format: '{{KEY}}' }),
      format: '{{KEY}}',
      values: { ghost: 'x' },
    });

    expect(plan.requests).toHaveLength(1);
    expect(plan.missing).toEqual(['{{ghost}}']);
  });

  it('also replaces the spacing variants found in the document', () => {
    const plan = templateFill.plan({
      scan: templateFill.scan({ document: singleTab([paragraph('{{ name }} {{name}}')]), format: '{{KEY}}' }),
      format: '{{KEY}}',
      values: { name: 'Ada' },
    });

    expect(plan.requests.map((request) => request.replaceAllText?.containsText?.text)).toEqual([
      '{{name}}',
      '{{ name }}',
    ]);
    expect(plan.missing).toEqual([]);
  });

  it('skips an empty per-placeholder input and lets Variables win', () => {
    const plan = templateFill.plan({
      scan: templateFill.scan({
        document: singleTab([paragraph('{{a}} {{b}} {{c}}')]),
        format: '{{KEY}}',
      }),
      format: '{{KEY}}',
      fields: { a: 'from field', b: '', c: 'from field' },
      values: { c: 'from variables' },
    });

    expect(plan.requests.map((request) => request.replaceAllText?.replaceText)).toEqual([
      'from field',
      'from variables',
    ]);
  });

  it('writes an empty Variables value as an empty string', () => {
    const plan = templateFill.plan({
      scan: emptyScan,
      format: '{{KEY}}',
      values: { a: '' },
    });

    expect(plan.requests[0].replaceAllText?.replaceText).toBe('');
  });

  it('turns numbers, booleans, nulls and objects into text', () => {
    const plan = templateFill.plan({
      scan: emptyScan,
      format: '{{KEY}}',
      values: { n: 12.5, b: false, nil: null, o: { a: 1 }, list: ['x', 'y'] },
    });

    expect(plan.requests.map((request) => request.replaceAllText?.replaceText)).toEqual([
      '12.5',
      'false',
      '',
      '{"a":1}',
      '["x","y"]',
    ]);
  });

  it('reads Variables sent as a JSON string', () => {
    const plan = templateFill.plan({
      scan: emptyScan,
      format: '{{KEY}}',
      values: '{"name":"Ada"}',
    });

    expect(plan.requests).toEqual([
      { replaceAllText: { containsText: { text: '{{name}}', matchCase: true }, replaceText: 'Ada' } },
    ]);
  });

  it('ignores Variables that are not an object', () => {
    expect(templateFill.plan({ scan: emptyScan, format: '{{KEY}}', values: 'not json' }).requests).toEqual([]);
    expect(templateFill.plan({ scan: emptyScan, format: '{{KEY}}', values: ['a'] }).requests).toEqual([]);
  });

  it('builds the same image request as before for an object ID', () => {
    const plan = templateFill.plan({
      scan: scanWithImages,
      format: '{{KEY}}',
      images: [{ imageObjectId: 'kix.a', url: 'https://example.com/a.png' }],
    });

    expect(plan.requests).toEqual([{ replaceImage: { imageObjectId: 'kix.a', uri: 'https://example.com/a.png' } }]);
  });

  it('finds an image by its alt text, with or without the brackets', () => {
    const plan = templateFill.plan({
      scan: scanWithImages,
      format: '{{KEY}}',
      images: [
        { imageObjectId: 'signature', url: 'https://example.com/s.png' },
        { imageObjectId: '{{logo}}', url: 'https://example.com/l.png' },
      ],
    });

    expect(plan.requests).toEqual([
      { replaceImage: { imageObjectId: 'kix.a', uri: 'https://example.com/s.png' } },
      { replaceImage: { imageObjectId: 'kix.b', uri: 'https://example.com/l.png', tabId: 't.1' } },
    ]);
  });

  it('passes the ID of a positioned object through, as before', () => {
    const plan = templateFill.plan({
      scan: templateFill.scan({
        document: {
          tabs: [
            {
              tabProperties: { tabId: 't.0' },
              documentTab: { body: { content: [] }, positionedObjects: { 'kix.floating': {} } },
            },
          ],
        },
        format: '{{KEY}}',
      }),
      format: '{{KEY}}',
      images: [{ imageObjectId: 'kix.floating', url: 'https://example.com/a.png' }],
    });

    expect(plan.requests).toEqual([
      { replaceImage: { imageObjectId: 'kix.floating', uri: 'https://example.com/a.png' } },
    ]);
  });

  it('rejects an object ID that is not in the document', () => {
    expect(() =>
      templateFill.plan({
        scan: scanWithImages,
        format: '{{KEY}}',
        images: [{ imageObjectId: 'kix.unknown', url: 'https://example.com/a.png' }],
      }),
    ).toThrow('Image "kix.unknown" was not found in the document');
  });

  it('rejects an image name that matches nothing', () => {
    expect(() =>
      templateFill.plan({
        scan: scanWithImages,
        format: '{{KEY}}',
        images: [{ imageObjectId: 'banner', url: 'https://example.com/a.png' }],
      }),
    ).toThrow('Image "banner" was not found in the document');
  });

  it('takes the per-image inputs and skips the empty ones', () => {
    const plan = templateFill.plan({
      scan: scanWithImages,
      format: '{{KEY}}',
      imageFields: { 'kix.a': 'https://example.com/a.png', 'kix.b': '' },
    });

    expect(plan.requests).toEqual([{ replaceImage: { imageObjectId: 'kix.a', uri: 'https://example.com/a.png' } }]);
  });
});

describe('templateFill.summarize', () => {
  it('counts occurrences per placeholder and reports what was not found or left unfilled', () => {
    const scan = templateFill.scan({
      document: {
        tabs: [
          {
            tabProperties: { tabId: 't.0' },
            documentTab: {
              body: { content: [paragraph('{{ name }} {{name}} {{date}}'), paragraphWithImage('kix.z')] },
              inlineObjects: { 'kix.z': image({}) },
            },
          },
        ],
      },
      format: '{{KEY}}',
    });
    const plan = templateFill.plan({
      scan,
      format: '{{KEY}}',
      values: { name: 'Ada', ghost: 'x' },
      imageFields: { 'kix.z': 'https://example.com/z.png' },
    });

    const summary = templateFill.summarize({
      scan,
      plan,
      replies: [
        { replaceAllText: { occurrencesChanged: 1 } },
        { replaceAllText: { occurrencesChanged: 1 } },
        { replaceAllText: {} },
        {},
      ],
    });

    expect(summary).toEqual({
      replacements: [
        { placeholder: '{{name}}', key: 'name', occurrences: 2 },
        { placeholder: '{{ghost}}', key: 'ghost', occurrences: 0 },
      ],
      totalReplacements: 2,
      placeholdersNotFound: ['{{ghost}}'],
      unfilledPlaceholders: ['{{date}}'],
      imagesReplaced: 1,
    });
  });
});

function paragraph(...runs: string[]): docs_v1.Schema$StructuralElement {
  return { paragraph: { elements: runs.map((content) => ({ textRun: { content } })) } };
}

function paragraphWithImage(inlineObjectId: string): docs_v1.Schema$StructuralElement {
  return { paragraph: { elements: [{ inlineObjectElement: { inlineObjectId } }] } };
}

function table(rows: docs_v1.Schema$StructuralElement[][]): docs_v1.Schema$StructuralElement {
  return { table: { tableRows: rows.map((cells) => ({ tableCells: cells.map((cell) => ({ content: [cell] })) })) } };
}

function image({ title, description }: { title?: string; description?: string }): docs_v1.Schema$InlineObject {
  return { inlineObjectProperties: { embeddedObject: { title, description, imageProperties: {} } } };
}

function singleTab(content: docs_v1.Schema$StructuralElement[]): docs_v1.Schema$Document {
  return { tabs: [{ tabProperties: { tabId: 't.0' }, documentTab: { body: { content } } }] };
}

const emptyScan = templateFill.scan({ document: singleTab([]), format: '{{KEY}}' });

const scanWithImages = templateFill.scan({
  document: {
    tabs: [
      {
        tabProperties: { tabId: 't.0' },
        documentTab: {
          body: { content: [paragraphWithImage('kix.a')] },
          inlineObjects: { 'kix.a': image({ title: 'Signature' }) },
        },
      },
      {
        tabProperties: { tabId: 't.1' },
        documentTab: {
          body: { content: [paragraphWithImage('kix.b')] },
          inlineObjects: { 'kix.b': image({ description: 'Logo' }) },
        },
      },
    ],
  },
  format: '{{KEY}}',
});
