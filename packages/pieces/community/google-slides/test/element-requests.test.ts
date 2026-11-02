import { describe, expect, it } from 'vitest';
import { slidesElementRequests } from '../src/lib/commons/element-requests';
import { slidesElements } from '../src/lib/commons/elements';

describe('units and colours', () => {
  it('converts points to EMU and back', () => {
    expect(slidesElements.ptToEmu(1)).toBe(12700);
    expect(slidesElements.ptToEmu(720)).toBe(9144000);
    expect(slidesElements.emuToPt(5143500)).toBe(405);
    expect(slidesElements.dimensionToEmu({ magnitude: 10, unit: 'PT' })).toBe(127000);
    expect(slidesElements.dimensionToEmu({ magnitude: 500, unit: 'EMU' })).toBe(500);
  });

  it('builds element properties in EMU', () => {
    const box = slidesElements.readBox({ x: 40, y: '24', width: 640, height: 80, required: true });
    expect(slidesElements.buildElementProperties({ pageObjectId: 's1', box })).toEqual({
      pageObjectId: 's1',
      size: { width: { magnitude: 8128000, unit: 'EMU' }, height: { magnitude: 1016000, unit: 'EMU' } },
      transform: { scaleX: 1, scaleY: 1, shearX: 0, shearY: 0, translateX: 508000, translateY: 304800, unit: 'EMU' },
    });
  });

  it('validates boxes', () => {
    expect(() => slidesElements.readBox({ x: 1, y: undefined, width: undefined, height: undefined, required: false })).toThrow(/both X and Y/);
    expect(() => slidesElements.readBox({ x: 1, y: 1, width: 5, height: undefined, required: false })).toThrow(/both Width and Height/);
    expect(() => slidesElements.readBox({ x: 1, y: 1, width: 0, height: 5, required: false })).toThrow(/greater than 0/);
    expect(() => slidesElements.readBox({ x: 1, y: 1, width: undefined, height: undefined, required: true })).toThrow(/720 x 405/);
    expect(slidesElements.readBox({ x: undefined, y: undefined, width: undefined, height: undefined, required: false })).toEqual({});
  });

  it('parses hex colours', () => {
    expect(slidesElements.parseHexColor({ value: '#FFFFFF', label: 'c' })).toEqual({ red: 1, green: 1, blue: 1 });
    expect(slidesElements.parseHexColor({ value: '1a73e8', label: 'c' })).toEqual({ red: 0.102, green: 0.451, blue: 0.9098 });
    expect(slidesElements.parseHexColor({ value: '#f00', label: 'c' })).toEqual({ red: 1, green: 0, blue: 0 });
    expect(() => slidesElements.parseHexColor({ value: 'blue', label: 'Fill Color' })).toThrow(/Fill Color must be a hex colour/);
    expect(slidesElements.readColor({ value: 'transparent', label: 'c' })).toEqual({ kind: 'none' });
    expect(slidesElements.readColor({ value: '', label: 'c' })).toBeUndefined();
  });

  it('reads booleans in three states', () => {
    expect(slidesElements.readBoolean({ value: undefined, label: 'Bold' })).toBeUndefined();
    expect(slidesElements.readBoolean({ value: false, label: 'Bold' })).toBe(false);
    expect(slidesElements.readBoolean({ value: 'true', label: 'Bold' })).toBe(true);
    expect(() => slidesElements.readBoolean({ value: 'yes', label: 'Bold' })).toThrow(/true or false/);
  });
});

describe('text ranges', () => {
  const target = { objectId: 'box', text: 'Revenue up, Revenue down\n' };

  it('defaults to ALL and finds every match', () => {
    expect(slidesElements.resolveTextRanges({ target, matchText: undefined, startIndex: undefined, endIndex: undefined })).toEqual([{ type: 'ALL' }]);
    expect(slidesElements.resolveTextRanges({ target, matchText: 'Revenue', startIndex: undefined, endIndex: undefined })).toEqual([
      { type: 'FIXED_RANGE', startIndex: 0, endIndex: 7 },
      { type: 'FIXED_RANGE', startIndex: 12, endIndex: 19 },
    ]);
    expect(slidesElements.resolveTextRanges({ target, matchText: undefined, startIndex: 3, endIndex: undefined })).toEqual([
      { type: 'FIXED_RANGE', startIndex: 3, endIndex: 24 },
    ]);
  });

  it('refuses empty text, no match, bad ranges and mixed modes', () => {
    expect(() => slidesElements.resolveTextRanges({ target: { objectId: 'e', text: '' }, matchText: undefined, startIndex: undefined, endIndex: undefined })).toThrow(/no text yet/);
    expect(() => slidesElements.resolveTextRanges({ target, matchText: 'revenue', startIndex: undefined, endIndex: undefined })).toThrow(/does not appear/);
    expect(() => slidesElements.resolveTextRanges({ target, matchText: undefined, startIndex: 5, endIndex: 2 })).toThrow(/0 <= start < end <= 25/);
    expect(() => slidesElements.resolveTextRanges({ target, matchText: 'up', startIndex: 0, endIndex: undefined })).toThrow(/not both/);
  });
});

describe('text request builders', () => {
  const cell = { objectId: 't1', cellLocation: { rowIndex: 1, columnIndex: 0 }, text: 'Old\n' };

  it('inserts at the end before the trailing newline, or at an index', () => {
    expect(slidesElementRequests.buildInsertTextRequest({ target: cell, text: '!', insertionIndex: undefined })).toEqual({
      request: { insertText: { objectId: 't1', cellLocation: { rowIndex: 1, columnIndex: 0 }, text: '!', insertionIndex: 3 } },
      insertedAt: 3,
      newText: 'Old!',
    });
    expect(slidesElementRequests.buildInsertTextRequest({ target: { objectId: 'b', text: '' }, text: 'Hi', insertionIndex: undefined }).insertedAt).toBe(0);
    expect(() => slidesElementRequests.buildInsertTextRequest({ target: cell, text: 'x', insertionIndex: 4 })).toThrow(/between 0 and 3/);
  });

  it('replaces text only when it changed', () => {
    expect(slidesElementRequests.buildSetTextRequests({ target: cell, text: 'New' })).toEqual([
      { deleteText: { objectId: 't1', cellLocation: { rowIndex: 1, columnIndex: 0 }, textRange: { type: 'ALL' } } },
      { insertText: { objectId: 't1', cellLocation: { rowIndex: 1, columnIndex: 0 }, text: 'New', insertionIndex: 0 } },
    ]);
    expect(slidesElementRequests.buildSetTextRequests({ target: cell, text: 'Old' })).toEqual([]);
    expect(slidesElementRequests.buildSetTextRequests({ target: { objectId: 'b', text: '\n' }, text: 'A' })).toEqual([
      { insertText: { objectId: 'b', text: 'A', insertionIndex: 0 } },
    ]);
    expect(slidesElementRequests.buildSetTextRequests({ target: cell, text: '' })).toEqual([
      { deleteText: { objectId: 't1', cellLocation: { rowIndex: 1, columnIndex: 0 }, textRange: { type: 'ALL' } } },
    ]);
  });

  it('builds a text style with only the fields that were set', () => {
    expect(
      slidesElementRequests.buildTextStyle({
        bold: false,
        fontSizePt: 18,
        textColor: { kind: 'rgb', rgbColor: { red: 1, green: 0, blue: 0 } },
        highlightColor: { kind: 'none' },
        link: null,
      })
    ).toEqual({
      style: { bold: false, fontSize: { magnitude: 18, unit: 'PT' }, foregroundColor: { opaqueColor: { rgbColor: { red: 1, green: 0, blue: 0 } } }, backgroundColor: {} },
      fields: ['bold', 'fontSize', 'foregroundColor', 'backgroundColor', 'link'],
    });
    expect(() => slidesElementRequests.buildTextStyle({})).toThrow(/at least one style/);
  });

  it('builds paragraph and bullet requests per range', () => {
    const requests = slidesElementRequests.buildParagraphRequests({
      target: { objectId: 'b', text: 'A\nB\n' },
      ranges: [{ type: 'ALL' }],
      input: { alignment: 'CENTER', spaceBelowPt: 6, bullets: 'NONE' },
    });
    expect(requests).toEqual([
      {
        updateParagraphStyle: {
          objectId: 'b',
          style: { alignment: 'CENTER', spaceBelow: { magnitude: 6, unit: 'PT' } },
          textRange: { type: 'ALL' },
          fields: 'alignment,spaceBelow',
        },
      },
      { deleteParagraphBullets: { objectId: 'b', textRange: { type: 'ALL' } } },
    ]);
    expect(
      slidesElementRequests.buildParagraphRequests({ target: { objectId: 'b', text: 'A\n' }, ranges: [{ type: 'ALL' }], input: { bullets: 'BULLET_CHECKBOX' } })
    ).toEqual([{ createParagraphBullets: { objectId: 'b', textRange: { type: 'ALL' }, bulletPreset: 'BULLET_CHECKBOX' } }]);
  });
});

describe('shape properties', () => {
  it('renders a fill and an outline', () => {
    expect(
      slidesElementRequests.buildShapeProperties({
        fillColor: { kind: 'rgb', rgbColor: { red: 0, green: 0, blue: 1 } },
        outlineWeightPt: 2,
        outlineDash: 'DASH',
        contentAlignment: 'MIDDLE',
      })
    ).toEqual({
      shapeProperties: {
        shapeBackgroundFill: { propertyState: 'RENDERED', solidFill: { color: { rgbColor: { red: 0, green: 0, blue: 1 } }, alpha: 1 } },
        outline: { propertyState: 'RENDERED', weight: { magnitude: 2, unit: 'PT' }, dashStyle: 'DASH' },
        contentAlignment: 'MIDDLE',
      },
      fields: [
        'shapeBackgroundFill.propertyState',
        'shapeBackgroundFill.solidFill.color',
        'shapeBackgroundFill.solidFill.alpha',
        'outline.propertyState',
        'outline.weight',
        'outline.dashStyle',
        'contentAlignment',
      ],
    });
  });

  it('hides fill and outline', () => {
    expect(slidesElementRequests.buildShapeProperties({ fillColor: { kind: 'none' }, outlineColor: { kind: 'none' } })).toEqual({
      shapeProperties: { shapeBackgroundFill: { propertyState: 'NOT_RENDERED' }, outline: { propertyState: 'NOT_RENDERED' } },
      fields: ['shapeBackgroundFill.propertyState', 'outline.propertyState'],
    });
    expect(() => slidesElementRequests.buildShapeProperties({ outlineColor: { kind: 'none' }, outlineWeightPt: 1 })).toThrow(/leave Outline Weight/);
  });
});

describe('tables', () => {
  it('reads data and sizes the table from it', () => {
    const data = slidesElementRequests.readTableData('[["a","b"],[1,null,true]]');
    expect(data).toEqual([['a', 'b'], ['1', '', 'true']]);
    expect(slidesElementRequests.resolveTableSize({ rows: undefined, columns: undefined, data })).toEqual({ rows: 2, columns: 3 });
    expect(() => slidesElementRequests.resolveTableSize({ rows: 1, columns: undefined, data })).toThrow(/does not fit/);
    expect(() => slidesElementRequests.resolveTableSize({ rows: undefined, columns: undefined, data: undefined })).toThrow(/at least 1/);
    expect(() => slidesElementRequests.readTableData([['a', { x: 1 }]])).toThrow(/row 1, column 2/);
    expect(() => slidesElementRequests.readTableData('{nope')).toThrow(/valid JSON/);
  });

  it('builds the inserts for rows and columns', () => {
    expect(
      slidesElementRequests.buildInsertTableLinesRequests({
        tableObjectId: 't',
        dimension: 'ROW',
        rows: 3,
        columns: 2,
        position: undefined,
        count: 1,
        values: ['x', ''],
      })
    ).toEqual({
      requests: [
        { insertTableRows: { tableObjectId: 't', cellLocation: { rowIndex: 2, columnIndex: 0 }, insertBelow: true, number: 1 } },
        { insertText: { objectId: 't', cellLocation: { rowIndex: 3, columnIndex: 0 }, text: 'x', insertionIndex: 0 } },
      ],
      insertedAt: 4,
    });
    expect(
      slidesElementRequests.buildInsertTableLinesRequests({ tableObjectId: 't', dimension: 'COLUMN', rows: 3, columns: 2, position: 1, count: 2, values: undefined })
        .requests
    ).toEqual([{ insertTableColumns: { tableObjectId: 't', cellLocation: { rowIndex: 0, columnIndex: 0 }, insertRight: false, number: 2 } }]);
    expect(() =>
      slidesElementRequests.buildInsertTableLinesRequests({ tableObjectId: 't', dimension: 'ROW', rows: 3, columns: 2, position: 5, count: 1, values: undefined })
    ).toThrow(/between 1 and 4/);
    expect(() =>
      slidesElementRequests.buildInsertTableLinesRequests({ tableObjectId: 't', dimension: 'ROW', rows: 3, columns: 2, position: undefined, count: 21, values: undefined })
    ).toThrow(/between 1 and 20/);
    expect(() =>
      slidesElementRequests.buildInsertTableLinesRequests({ tableObjectId: 't', dimension: 'ROW', rows: 3, columns: 2, position: undefined, count: 1, values: ['a', 'b', 'c'] })
    ).toThrow(/at most 2/);
  });

  it('deletes at a fixed index and keeps at least one line', () => {
    expect(
      slidesElementRequests.buildDeleteTableLinesRequests({ tableObjectId: 't', dimension: 'ROW', rows: 4, columns: 2, position: 2, count: 2 })
    ).toEqual([
      { deleteTableRow: { tableObjectId: 't', cellLocation: { rowIndex: 1, columnIndex: 0 } } },
      { deleteTableRow: { tableObjectId: 't', cellLocation: { rowIndex: 1, columnIndex: 0 } } },
    ]);
    expect(() =>
      slidesElementRequests.buildDeleteTableLinesRequests({ tableObjectId: 't', dimension: 'COLUMN', rows: 4, columns: 2, position: 1, count: 2 })
    ).toThrow(/at least one column/);
    expect(() =>
      slidesElementRequests.buildDeleteTableLinesRequests({ tableObjectId: 't', dimension: 'ROW', rows: 4, columns: 2, position: 4, count: 2 })
    ).toThrow(/has 4 row/);
  });
});

describe('videos', () => {
  it('detects YouTube and Drive sources', () => {
    expect(slidesElements.readVideo({ value: 'https://www.youtube.com/watch?v=M7lc1UVf-VE&t=3', source: undefined })).toEqual({ source: 'YOUTUBE', id: 'M7lc1UVf-VE' });
    expect(slidesElements.readVideo({ value: 'https://youtu.be/M7lc1UVf-VE', source: undefined })).toEqual({ source: 'YOUTUBE', id: 'M7lc1UVf-VE' });
    expect(slidesElements.readVideo({ value: 'https://www.youtube.com/shorts/M7lc1UVf-VE', source: undefined }).id).toBe('M7lc1UVf-VE');
    expect(slidesElements.readVideo({ value: 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view', source: undefined })).toEqual({ source: 'DRIVE', id: '1AbCdEfGhIjKlMnOp' });
    expect(slidesElements.readVideo({ value: '1AbCdEfGhIjKlMnOp', source: 'DRIVE' })).toEqual({ source: 'DRIVE', id: '1AbCdEfGhIjKlMnOp' });
    expect(() => slidesElements.readVideo({ value: '1AbCdEfGhIjKlMnOp', source: undefined })).toThrow(/set Source to DRIVE/);
    expect(() => slidesElements.readVideo({ value: 'https://www.youtube.com.evil.io/watch?v=M7lc1UVf-VE', source: undefined })).toThrow(/not a YouTube/);
    expect(() => slidesElements.readVideo({ value: 'https://youtu.be/M7lc1UVf-VE', source: 'DRIVE' })).toThrow(/YOUTUBE link/);
  });
});
