import { describe, expect, it } from 'vitest';
import { slidesRequests } from '../src/lib/commons/requests';
import { Page } from '../src/lib/commons/common';

const slides = [{ objectId: 'a' }, { objectId: 'b' }, { objectId: 'c' }];

describe('slide selection', () => {
  it('needs exactly one of number or object ID', () => {
    expect(() => slidesRequests.readSlideSelector({ slideNumber: undefined, slideObjectId: '' })).toThrow(/either/);
    expect(() => slidesRequests.readSlideSelector({ slideNumber: 1, slideObjectId: 'a' })).toThrow(/only one/);
    expect(slidesRequests.readSlideSelector({ slideNumber: '2', slideObjectId: undefined })).toEqual({ slideNumber: 2 });
    expect(() => slidesRequests.readSlideSelector({ slideNumber: 0, slideObjectId: undefined })).toThrow(/starts at 1/);
    expect(() => slidesRequests.readSlideSelector({ slideNumber: 1.5, slideObjectId: undefined })).toThrow(/whole number/);
  });

  it('resolves numbers and object IDs and refuses unknown ones', () => {
    expect(slidesRequests.resolveSlide({ slides, selector: { slideNumber: 3 } })).toEqual({ objectId: 'c', index: 2 });
    expect(slidesRequests.resolveSlide({ slides, selector: { slideObjectId: 'b' } })).toEqual({ objectId: 'b', index: 1 });
    expect(() => slidesRequests.resolveSlide({ slides, selector: { slideNumber: 4 } })).toThrow(/out of range/);
    expect(() => slidesRequests.resolveSlide({ slides, selector: { slideObjectId: 'shape_1' } })).toThrow(/No slide/);
  });

  it('reads 1-based positions into 0-based indexes', () => {
    expect(slidesRequests.readPosition({ position: undefined, maxPosition: 3 })).toBeUndefined();
    expect(slidesRequests.readPosition({ position: 1, maxPosition: 3 })).toBe(0);
    expect(() => slidesRequests.readPosition({ position: 4, maxPosition: 3 })).toThrow(/between 1 and 3/);
  });
});

describe('moveInsertionIndex', () => {
  it('accounts for the "arrangement before the move" rule', () => {
    expect(slidesRequests.moveInsertionIndex({ currentIndex: 0, targetIndex: 3 })).toBe(4);
    expect(slidesRequests.moveInsertionIndex({ currentIndex: 3, targetIndex: 0 })).toBe(0);
    expect(slidesRequests.moveInsertionIndex({ currentIndex: 2, targetIndex: 2 })).toBe(2);
  });
});

describe('buildAddSlideRequests', () => {
  const layouts: Page[] = [
    {
      objectId: 'lay_title',
      layoutProperties: { name: 'TITLE' },
      pageElements: [
        { objectId: 'x1', shape: { placeholder: { type: 'CENTERED_TITLE', index: 0 } } },
        { objectId: 'x2', shape: { placeholder: { type: 'SUBTITLE', index: 0 } } },
      ],
    },
    {
      objectId: 'lay_tb',
      layoutProperties: { name: 'TITLE_AND_BODY' },
      pageElements: [
        { objectId: 'y1', shape: { placeholder: { type: 'TITLE' } } },
        { objectId: 'y2', shape: { placeholder: { type: 'BODY', index: 2 } } },
        { objectId: 'y3', shape: { placeholder: { type: 'BODY', index: 1 } } },
      ],
    },
    { objectId: 'lay_blank', layoutProperties: { name: 'BLANK' }, pageElements: [] },
  ];
  const newId = (prefix: string) => `${prefix}_00001`;

  it('maps the TITLE layout to CENTERED_TITLE + SUBTITLE and sends one atomic batch', () => {
    const built = slidesRequests.buildAddSlideRequests({
      layouts,
      predefinedLayout: 'TITLE',
      insertionIndex: 0,
      title: 'Hello',
      body: 'World',
      newId,
    });
    expect(built.requests).toEqual([
      {
        createSlide: {
          objectId: 'slide_00001',
          insertionIndex: 0,
          slideLayoutReference: { layoutId: 'lay_title' },
          placeholderIdMappings: [
            { layoutPlaceholder: { type: 'CENTERED_TITLE', index: 0 }, objectId: 'title_00001' },
            { layoutPlaceholder: { type: 'SUBTITLE', index: 0 }, objectId: 'body_00001' },
          ],
        },
      },
      { insertText: { objectId: 'title_00001', text: 'Hello', insertionIndex: 0 } },
      { insertText: { objectId: 'body_00001', text: 'World', insertionIndex: 0 } },
    ]);
    expect(built).toMatchObject({ titleObjectId: 'title_00001', bodyObjectId: 'body_00001' });
  });

  it('uses the lowest-index BODY placeholder and omits empty fields', () => {
    const built = slidesRequests.buildAddSlideRequests({ layouts, predefinedLayout: 'TITLE_AND_BODY', body: 'B', newId });
    expect(built.requests).toEqual([
      {
        createSlide: {
          objectId: 'slide_00001',
          slideLayoutReference: { layoutId: 'lay_tb' },
          placeholderIdMappings: [{ layoutPlaceholder: { type: 'BODY', index: 1 }, objectId: 'body_00001' }],
        },
      },
      { insertText: { objectId: 'body_00001', text: 'B', insertionIndex: 0 } },
    ]);
    expect(built.titleObjectId).toBeNull();
  });

  it('fails before writing when the layout or placeholder is missing', () => {
    expect(() => slidesRequests.buildAddSlideRequests({ layouts, predefinedLayout: 'BLANK', title: 'x', newId })).toThrow(
      /no title placeholder/
    );
    expect(() => slidesRequests.buildAddSlideRequests({ layouts, predefinedLayout: 'MAIN_POINT', newId })).toThrow(
      /Available layouts: TITLE, TITLE_AND_BODY, BLANK/
    );
  });
});

describe('buildDuplicateRequests', () => {
  it('only duplicates when no position is given', () => {
    expect(
      slidesRequests.buildDuplicateRequests({ sourceObjectId: 'a', sourceIndex: 0, newObjectId: 'slide_new1' })
    ).toEqual({ requests: [{ duplicateObject: { objectId: 'a', objectIds: { a: 'slide_new1' } } }], finalIndex: 1 });
  });

  it('moves the copy in the same batch', () => {
    expect(
      slidesRequests.buildDuplicateRequests({ sourceObjectId: 'b', sourceIndex: 1, newObjectId: 'slide_new1', targetIndex: 0 })
    ).toEqual({
      requests: [
        { duplicateObject: { objectId: 'b', objectIds: { b: 'slide_new1' } } },
        { updateSlidesPosition: { slideObjectIds: ['slide_new1'], insertionIndex: 0 } },
      ],
      finalIndex: 0,
    });
  });
});

describe('buildSpeakerNotesRequests', () => {
  it('deletes only when there is text, inserts only when there are notes, and no-ops when unchanged', () => {
    const id = 'n1';
    expect(slidesRequests.buildSpeakerNotesRequests({ speakerNotesObjectId: id, currentNotes: '', notes: 'Hi' })).toEqual([
      { insertText: { objectId: id, text: 'Hi', insertionIndex: 0 } },
    ]);
    expect(slidesRequests.buildSpeakerNotesRequests({ speakerNotesObjectId: id, currentNotes: 'Old', notes: '' })).toEqual([
      { deleteText: { objectId: id, textRange: { type: 'ALL' } } },
    ]);
    expect(slidesRequests.buildSpeakerNotesRequests({ speakerNotesObjectId: id, currentNotes: 'Same', notes: 'Same' })).toEqual([]);
  });
});

describe('image geometry', () => {
  it('requires size and position as pairs', () => {
    expect(() => slidesRequests.readImageGeometry({ width: 10 })).toThrow(/Width and Height/);
    expect(() => slidesRequests.readImageGeometry({ x: 10 })).toThrow(/X and Y/);
    expect(() => slidesRequests.readImageGeometry({ width: 0, height: 5 })).toThrow(/greater than 0/);
    expect(slidesRequests.readImageGeometry({})).toEqual({});
  });

  it('builds the createImage request in points', () => {
    const geometry = slidesRequests.readImageGeometry({ x: '10', y: 20, width: 100, height: 50 });
    expect(slidesRequests.buildCreateImageRequest({ objectId: 'image_1', slideObjectId: 'p', url: 'https://x.io/a.png', geometry })).toEqual({
      createImage: {
        objectId: 'image_1',
        url: 'https://x.io/a.png',
        elementProperties: {
          pageObjectId: 'p',
          size: { width: { magnitude: 100, unit: 'PT' }, height: { magnitude: 50, unit: 'PT' } },
          transform: { scaleX: 1, scaleY: 1, shearX: 0, shearY: 0, translateX: 10, translateY: 20, unit: 'PT' },
        },
      },
    });
  });
});

describe('replace requests', () => {
  it('sends an empty replacement as a real clear and scopes pages only when given', () => {
    expect(slidesRequests.buildReplaceTextRequest({ find: '[[x]]', replaceWith: '', matchCase: true })).toEqual({
      replaceAllText: { containsText: { text: '[[x]]', matchCase: true }, replaceText: '' },
    });
    expect(
      slidesRequests.buildReplaceShapesRequest({
        find: '[[logo]]',
        imageUrl: 'https://x.io/l.png',
        replaceMethod: 'CENTER_CROP',
        matchCase: false,
        pageObjectIds: ['p'],
      })
    ).toEqual({
      replaceAllShapesWithImage: {
        containsText: { text: '[[logo]]', matchCase: false },
        imageUrl: 'https://x.io/l.png',
        imageReplaceMethod: 'CENTER_CROP',
        pageObjectIds: ['p'],
      },
    });
  });

  it('reads slide scopes from IDs or URLs and ignores blanks', () => {
    expect(slidesRequests.readSlideObjectIds(undefined)).toBeUndefined();
    expect(slidesRequests.readSlideObjectIds(['', ' '])).toBeUndefined();
    expect(
      slidesRequests.readSlideObjectIds(['p', 'https://docs.google.com/presentation/d/1234567890ab/edit#slide=id.g1_0_2'])
    ).toEqual(['p', 'g1_0_2']);
  });

  it('reads occurrencesChanged, defaulting to 0 when Google omits it', () => {
    expect(slidesRequests.occurrencesChanged({ replies: [{ replaceAllText: { occurrencesChanged: 3 } }], key: 'replaceAllText' })).toBe(3);
    expect(slidesRequests.occurrencesChanged({ replies: [{ replaceAllText: {} }], key: 'replaceAllText' })).toBe(0);
    expect(slidesRequests.occurrencesChanged({ replies: [], key: 'replaceAllShapesWithImage' })).toBe(0);
  });
});

describe('buildTemplateRequests', () => {
  it('replaces every field, including title, with strings and keeps inner spacing', () => {
    expect(slidesRequests.buildTemplateRequests({ tableData: { title: 'Deck', ' name ': 'Ann', n: 5, empty: undefined }, format: '{{}}' })).toEqual([
      { replaceAllText: { containsText: { text: '{{title}}', matchCase: true }, replaceText: 'Deck' } },
      { replaceAllText: { containsText: { text: '{{ name }}', matchCase: true }, replaceText: 'Ann' } },
      { replaceAllText: { containsText: { text: '{{n}}', matchCase: true }, replaceText: '5' } },
      { replaceAllText: { containsText: { text: '{{empty}}', matchCase: true }, replaceText: '' } },
    ]);
    expect(slidesRequests.toPlaceholder({ name: 'x', format: '[[]]' })).toBe('[[x]]');
  });
});

describe('Drive helpers', () => {
  it('escapes quotes and backslashes in the search query', () => {
    expect(slidesRequests.buildFindQuery({ nameContains: "it's \\ odd", folderId: 'f1' })).toBe(
      "mimeType='application/vnd.google-apps.presentation' and trashed=false and name contains 'it\\'s \\\\ odd' and 'f1' in parents"
    );
    expect(slidesRequests.buildFindQuery({})).toBe("mimeType='application/vnd.google-apps.presentation' and trashed=false");
  });

  it('makes safe export file names', () => {
    expect(slidesRequests.exportFileName({ baseName: 'deck/q3: final', extension: 'pptx' })).toBe('deck_q3_ final.pptx');
    expect(slidesRequests.exportFileName({ baseName: 'a.pdf', extension: 'pdf' })).toBe('a.pdf');
    expect(slidesRequests.exportFileName({ baseName: '  ', extension: 'pdf' })).toBe('presentation.pdf');
  });
});

describe('readBatchRequests', () => {
  it('accepts a non-empty array of single-kind request objects, also as a JSON string', () => {
    expect(slidesRequests.readBatchRequests([{ deleteObject: { objectId: 'x' } }])).toHaveLength(1);
    expect(slidesRequests.readBatchRequests('[{"deleteObject":{"objectId":"x"}}]')).toHaveLength(1);
  });

  it.each([[[]], [{}], ['not json'], [[{ a: 1, b: 2 }]], [[null]], [[[1]]]])('rejects %j', (value) => {
    expect(() => slidesRequests.readBatchRequests(value)).toThrow();
  });
});
