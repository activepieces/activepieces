import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import {
  Action,
  AppConnectionType,
  createMockActionContext,
  InputPropertyMap,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { googleSlide } from '../src';
import { googleSlidesAuth, GoogleSlidesAuthValue } from '../src/lib/auth';
import { Presentation } from '../src/lib/commons/common';
import { createShape } from '../src/lib/actions/create-shape';
import { createTable } from '../src/lib/actions/create-table';
import { deleteElements } from '../src/lib/actions/delete-elements';
import { deleteTableRowsOrColumns } from '../src/lib/actions/delete-table-rows-or-columns';
import { insertTableRowsOrColumns } from '../src/lib/actions/insert-table-rows-or-columns';
import { insertText } from '../src/lib/actions/insert-text';
import { insertVideo } from '../src/lib/actions/insert-video';
import { listSlideElements } from '../src/lib/actions/list-slide-elements';
import { moveResizeElement } from '../src/lib/actions/move-resize-element';
import { replaceImage } from '../src/lib/actions/replace-image';
import { setElementText } from '../src/lib/actions/set-element-text';
import { setSlideBackground } from '../src/lib/actions/set-slide-background';
import { updateParagraphStyle } from '../src/lib/actions/update-paragraph-style';
import { updateShapeProperties } from '../src/lib/actions/update-shape-properties';
import { updateTextStyle } from '../src/lib/actions/update-text-style';

const PID = '1AbCdEfGhIjKlMnOpQrStUvWxYz';
const URL_INPUT = `https://docs.google.com/presentation/d/${PID}/edit#slide=id.s1`;

const AUTH: GoogleSlidesAuthValue = {
  type: AppConnectionType.OAUTH2,
  access_token: 'test-token',
  client_id: 'client',
  client_secret: 'secret',
  redirect_url: 'https://example.com',
  token_type: 'Bearer',
  claimed_at: 0,
  refresh_token: 'refresh',
  scope: '',
  token_url: 'https://oauth2.googleapis.com/token',
  data: {},
};

const TABLE_DATA: Record<string, unknown> = JSON.parse('[["Region","Q1"],["EMEA",12]]');

const size = { width: { magnitude: 3000000, unit: 'EMU' }, height: { magnitude: 1000000, unit: 'EMU' } };

function deck(): Presentation {
  return {
    presentationId: PID,
    revisionId: 'rev1',
    pageSize: { width: { magnitude: 9144000, unit: 'EMU' }, height: { magnitude: 5143500, unit: 'EMU' } },
    slides: [
      {
        objectId: 's1',
        pageElements: [
          {
            objectId: 'box1',
            size,
            transform: { scaleX: 1, scaleY: 1, translateX: 127000, translateY: 254000, unit: 'EMU' },
            shape: { shapeType: 'TEXT_BOX', text: { textElements: [{ paragraphMarker: {} }, { textRun: { content: 'Hello world\n' } }] } },
          },
          {
            objectId: 'tbl1',
            size,
            transform: { scaleX: 1, scaleY: 1, unit: 'EMU' },
            table: {
              rows: 2,
              columns: 2,
              tableColumns: [{ columnWidth: { magnitude: 1270000, unit: 'EMU' } }, { columnWidth: { magnitude: 1270000, unit: 'EMU' } }],
              tableRows: [
                { rowHeight: { magnitude: 254000, unit: 'EMU' }, tableCells: [{ text: { textElements: [{ textRun: { content: 'A\n' } }] } }, {}] },
                { rowHeight: { magnitude: 254000, unit: 'EMU' }, tableCells: [{}, { text: { textElements: [{ textRun: { content: 'D\n' } }] } }] },
              ],
            },
          },
          { objectId: 'img1', size, transform: { scaleX: 1, scaleY: 1, unit: 'EMU' }, image: { contentUrl: 'https://lh3.googleusercontent.com/x' } },
          {
            objectId: 'grp1',
            transform: { scaleX: 1, scaleY: 1, translateX: 1270000, unit: 'EMU' },
            elementGroup: {
              children: [
                { objectId: 'child1', size, transform: { scaleX: 2, scaleY: 1, translateX: 127000, unit: 'EMU' }, shape: { shapeType: 'RECTANGLE' } },
              ],
            },
          },
          {
            objectId: 'rot1',
            size,
            transform: { scaleX: 0, scaleY: 0, shearX: -1, shearY: 1, unit: 'EMU' },
            shape: { shapeType: 'RECTANGLE' },
          },
        ],
      },
      { objectId: 's2', pageElements: [] },
    ],
  };
}

let posts: unknown[] = [];
let gets: HttpRequest[] = [];
let failBatchWith: HttpError | undefined;

beforeEach(() => {
  posts = [];
  gets = [];
  failBatchWith = undefined;
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
    if (request.method === HttpMethod.POST) {
      if (failBatchWith) {
        throw failBatchWith;
      }
      posts.push(request.body);
      return { status: 200, headers: {}, body: { presentationId: PID, replies: [] } };
    }
    gets.push(request);
    const pageId = request.url.split('/pages/')[1];
    const page = pageId ? deck().slides?.find((slide) => slide.objectId === pageId) : undefined;
    return { status: 200, headers: {}, body: page ?? deck() };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function run<Props extends InputPropertyMap>({
  action,
  propsValue,
}: {
  action: Action<typeof googleSlidesAuth, Props>;
  propsValue: StaticPropsValue<Props>;
}): Promise<unknown> {
  return action.run({ ...createMockActionContext<Props>({ propsValue }), auth: AUTH });
}

describe('registration and metadata', () => {
  const atomics = [
    listSlideElements,
    createShape,
    insertText,
    setElementText,
    updateTextStyle,
    updateParagraphStyle,
    updateShapeProperties,
    moveResizeElement,
    deleteElements,
    createTable,
    insertTableRowsOrColumns,
    deleteTableRowsOrColumns,
    setSlideBackground,
    insertVideo,
    replaceImage,
  ];

  it('registers the 15 atomics as ai-only with an output schema', () => {
    const registered = Object.keys(googleSlide.actions());
    for (const action of atomics) {
      expect(registered).toContain(action.name);
      expect(action.audience).toBe('ai');
      expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
      expect(action.aiMetadata?.description?.length).toBeGreaterThan(100);
    }
    expect(registered).toHaveLength(35);
  });

  it('classifies by side effect', () => {
    expect(listSlideElements.classification).toBe('READ');
    expect(deleteElements.classification).toBe('DESTRUCTIVE');
    expect(deleteTableRowsOrColumns.classification).toBe('DESTRUCTIVE');
    expect(createShape.classification).toBe('WRITE');
    expect(createShape.aiMetadata?.idempotent).toBe(false);
    expect(setElementText.aiMetadata?.idempotent).toBe(true);
  });
});

describe('list_slide_elements', () => {
  it('returns geometry in points, composing group transforms', async () => {
    const output = await run({ action: listSlideElements, propsValue: { presentation_id: URL_INPUT, slide_number: 1, slide_object_id: undefined } });
    expect(gets.map((request) => request.url)).toEqual([
      `https://slides.googleapis.com/v1/presentations/${PID}`,
      `https://slides.googleapis.com/v1/presentations/${PID}/pages/s1`,
    ]);
    expect(gets[0].queryParams).toEqual({ fields: 'presentationId,pageSize,slides(objectId)' });
    expect(output).toMatchObject({ presentationId: PID, slideObjectId: 's1', slideWidth: 720, slideHeight: 405, elementCount: 6 });
    expect(output).toHaveProperty('elements', expect.arrayContaining([
      expect.objectContaining({ objectId: 'box1', type: 'SHAPE', x: 10, y: 20, width: 236.22, height: 78.74, text: 'Hello world' }),
      expect.objectContaining({ objectId: 'tbl1', type: 'TABLE', width: 200, height: 40, tableRows: 2, tableColumns: 2, tableCells: [['A', ''], ['', 'D']] }),
      expect.objectContaining({ objectId: 'child1', parentGroupId: 'grp1', x: 110, width: 472.44 }),
      expect.objectContaining({ objectId: 'grp1', type: 'GROUP', x: 110, y: 0, width: 472.44, height: 78.74 }),
      expect.objectContaining({ objectId: 'rot1', rotationDegrees: 90 }),
    ]));
  });
});

describe('create_shape', () => {
  it('sends createShape, insertText and the fill in one batch, in EMU', async () => {
    const output = await run({
      action: createShape,
      propsValue: { presentation_id: PID, slide_number: undefined, slide_object_id: 's2', shape_type: 'ELLIPSE', x: 40, y: 24, width: 100, height: 50, text: 'Hi', fill_color: '#ffffff' },
    });
    expect(gets).toHaveLength(0);
    const objectId = expect.stringMatching(/^shape_[0-9a-f]{32}$/);
    expect(posts).toEqual([
      {
        requests: [
          {
            createShape: {
              objectId,
              shapeType: 'ELLIPSE',
              elementProperties: {
                pageObjectId: 's2',
                size: { width: { magnitude: 1270000, unit: 'EMU' }, height: { magnitude: 635000, unit: 'EMU' } },
                transform: { scaleX: 1, scaleY: 1, shearX: 0, shearY: 0, translateX: 508000, translateY: 304800, unit: 'EMU' },
              },
            },
          },
          { insertText: { objectId, text: 'Hi', insertionIndex: 0 } },
          {
            updateShapeProperties: {
              objectId,
              shapeProperties: { shapeBackgroundFill: { propertyState: 'RENDERED', solidFill: { color: { rgbColor: { red: 1, green: 1, blue: 1 } }, alpha: 1 } } },
              fields: 'shapeBackgroundFill.propertyState,shapeBackgroundFill.solidFill.color,shapeBackgroundFill.solidFill.alpha',
            },
          },
        ],
      },
    ]);
    expect(output).toMatchObject({ presentationId: PID, slideObjectId: 's2', shapeType: 'ELLIPSE', x: 40, width: 100, text: 'Hi', objectId });
  });

  it('defaults to a text box and refuses a missing size before any request', async () => {
    await expect(
      run({ action: createShape, propsValue: { presentation_id: PID, slide_number: 1, slide_object_id: undefined, shape_type: undefined, x: 1, y: 1, width: 0, height: 5, text: undefined, fill_color: undefined } })
    ).rejects.toThrow(/greater than 0/);
    expect(gets).toHaveLength(0);
    await run({ action: createShape, propsValue: { presentation_id: PID, slide_number: 1, slide_object_id: undefined, shape_type: undefined, x: 1, y: 1, width: 5, height: 5, text: undefined, fill_color: undefined } });
    expect(gets[0].queryParams).toEqual({ fields: 'revisionId,slides(objectId)' });
    expect(posts).toEqual([
      { requests: [expect.objectContaining({ createShape: expect.objectContaining({ shapeType: 'TEXT_BOX' }) })], writeControl: { requiredRevisionId: 'rev1' } },
    ]);
  });

  it('adds a hint when Google cannot find an object', async () => {
    failBatchWith = new HttpError({}, { status: 400, responseBody: { error: { code: 400, message: 'The object (s9) could not be found.' } } });
    await expect(
      run({ action: createShape, propsValue: { presentation_id: PID, slide_number: undefined, slide_object_id: 's9', shape_type: undefined, x: 1, y: 1, width: 5, height: 5, text: undefined, fill_color: undefined } })
    ).rejects.toThrow('Could not create the shape: Google rejected the request (400). Google says: The object (s9) could not be found. Check the object IDs with Get Presentation Outline or List Slide Elements.');
  });
});

describe('insert_text and set_element_text', () => {
  it('appends before the trailing newline and pins the revision', async () => {
    const output = await run({ action: insertText, propsValue: { presentation_id: PID, object_id: 'box1', row: undefined, column: undefined, text: '!', insertion_index: undefined } });
    expect(gets[0].queryParams).toEqual({ fields: 'presentationId,revisionId,pageSize,slides(objectId,pageElements)' });
    expect(posts).toEqual([{ requests: [{ insertText: { objectId: 'box1', text: '!', insertionIndex: 11 } }], writeControl: { requiredRevisionId: 'rev1' } }]);
    expect(output).toEqual({ presentationId: PID, slideObjectId: 's1', objectId: 'box1', row: null, column: null, insertedAt: 11, text: 'Hello world!' });
  });

  it('explains wrong ids, kinds and cells', async () => {
    const base = { presentation_id: PID, row: undefined, column: undefined, text: 'x', insertion_index: undefined };
    await expect(run({ action: insertText, propsValue: { ...base, object_id: 'nope' } })).rejects.toThrow(/No element with object ID "nope".*List Slide Elements/);
    await expect(run({ action: insertText, propsValue: { ...base, object_id: 's1' } })).rejects.toThrow(/"s1" is a slide, not an element/);
    await expect(run({ action: insertText, propsValue: { ...base, object_id: 'img1' } })).rejects.toThrow(/is an IMAGE; text actions work on shapes/);
    await expect(run({ action: insertText, propsValue: { ...base, object_id: 'tbl1' } })).rejects.toThrow(/is a table \(2 x 2\): set Row and Column/);
    await expect(run({ action: insertText, propsValue: { ...base, object_id: 'tbl1', row: 3, column: 1 } })).rejects.toThrow(/outside the table/);
    await expect(run({ action: insertText, propsValue: { ...base, object_id: 'box1', insertion_index: 12 } })).rejects.toThrow(/between 0 and 11/);
    expect(posts).toHaveLength(0);
  });

  it('rewrites a table cell, and sends nothing when unchanged', async () => {
    const output = await run({ action: setElementText, propsValue: { presentation_id: PID, object_id: 'tbl1', row: 1, column: 1, text: 'B', clear_text: undefined } });
    expect(posts).toEqual([
      {
        requests: [
          { deleteText: { objectId: 'tbl1', cellLocation: { rowIndex: 0, columnIndex: 0 }, textRange: { type: 'ALL' } } },
          { insertText: { objectId: 'tbl1', cellLocation: { rowIndex: 0, columnIndex: 0 }, text: 'B', insertionIndex: 0 } },
        ],
        writeControl: { requiredRevisionId: 'rev1' },
      },
    ]);
    expect(output).toMatchObject({ row: 1, column: 1, changed: true, text: 'B' });
    posts = [];
    const same = await run({ action: setElementText, propsValue: { presentation_id: PID, object_id: 'box1', row: undefined, column: undefined, text: 'Hello world', clear_text: undefined } });
    expect(posts).toHaveLength(0);
    expect(same).toMatchObject({ changed: false });
  });

  it('needs Clear Text to empty an element', async () => {
    await expect(
      run({ action: setElementText, propsValue: { presentation_id: PID, object_id: 'box1', row: undefined, column: undefined, text: undefined, clear_text: undefined } })
    ).rejects.toThrow(/turn on Clear Text/);
    await run({ action: setElementText, propsValue: { presentation_id: PID, object_id: 'box1', row: undefined, column: undefined, text: undefined, clear_text: true } });
    expect(posts).toEqual([{ requests: [{ deleteText: { objectId: 'box1', textRange: { type: 'ALL' } } }], writeControl: { requiredRevisionId: 'rev1' } }]);
  });
});

describe('update_text_style and update_paragraph_style', () => {
  it('styles every match with a computed field mask', async () => {
    const output = await run({
      action: updateTextStyle,
      propsValue: {
        presentation_id: PID,
        object_id: 'box1',
        row: undefined,
        column: undefined,
        match_text: 'world',
        start_index: undefined,
        end_index: undefined,
        bold: true,
        italic: undefined,
        underline: undefined,
        strikethrough: undefined,
        font_family: undefined,
        font_size: 32,
        text_color: '#1A73E8',
        highlight_color: undefined,
        link_url: undefined,
      },
    });
    expect(posts).toEqual([
      {
        requests: [
          {
            updateTextStyle: {
              objectId: 'box1',
              style: { bold: true, fontSize: { magnitude: 32, unit: 'PT' }, foregroundColor: { opaqueColor: { rgbColor: { red: 0.102, green: 0.451, blue: 0.9098 } } } },
              textRange: { type: 'FIXED_RANGE', startIndex: 6, endIndex: 11 },
              fields: 'bold,fontSize,foregroundColor',
            },
          },
        ],
        writeControl: { requiredRevisionId: 'rev1' },
      },
    ]);
    expect(output).toEqual({ presentationId: PID, slideObjectId: 's1', objectId: 'box1', rangesStyled: 1, updatedFields: ['bold', 'fontSize', 'foregroundColor'] });
  });

  it('refuses no styles, a bad link and text-less elements', async () => {
    const base = {
      presentation_id: PID,
      object_id: 'box1',
      row: undefined,
      column: undefined,
      match_text: undefined,
      start_index: undefined,
      end_index: undefined,
      bold: undefined,
      italic: undefined,
      underline: undefined,
      strikethrough: undefined,
      font_family: undefined,
      font_size: undefined,
      text_color: undefined,
      highlight_color: undefined,
      link_url: undefined,
    };
    await expect(run({ action: updateTextStyle, propsValue: base })).rejects.toThrow(/at least one style/);
    await expect(run({ action: updateTextStyle, propsValue: { ...base, link_url: 'javascript:alert(1)' } })).rejects.toThrow(/http/);
    await expect(run({ action: updateTextStyle, propsValue: { ...base, object_id: 'child1', bold: true } })).rejects.toThrow(/no text yet/);
    expect(gets).toHaveLength(1);
    await run({ action: updateTextStyle, propsValue: { ...base, link_url: 'none' } });
    expect(posts).toEqual([
      { requests: [{ updateTextStyle: { objectId: 'box1', style: {}, textRange: { type: 'ALL' }, fields: 'link' } }], writeControl: { requiredRevisionId: 'rev1' } },
    ]);
  });

  it('sets alignment and bullets on a table cell', async () => {
    await run({
      action: updateParagraphStyle,
      propsValue: {
        presentation_id: PID,
        object_id: 'tbl1',
        row: 2,
        column: 2,
        match_text: undefined,
        start_index: undefined,
        end_index: undefined,
        alignment: 'CENTER',
        line_spacing: undefined,
        space_above: undefined,
        space_below: undefined,
        bullets: 'BULLET_CHECKBOX',
      },
    });
    const cellLocation = { rowIndex: 1, columnIndex: 1 };
    expect(posts).toEqual([
      {
        requests: [
          { updateParagraphStyle: { objectId: 'tbl1', cellLocation, style: { alignment: 'CENTER' }, textRange: { type: 'ALL' }, fields: 'alignment' } },
          { createParagraphBullets: { objectId: 'tbl1', cellLocation, textRange: { type: 'ALL' }, bulletPreset: 'BULLET_CHECKBOX' } },
        ],
        writeControl: { requiredRevisionId: 'rev1' },
      },
    ]);
  });
});

describe('update_shape_properties', () => {
  it('updates a shape and refuses other kinds', async () => {
    const base = { presentation_id: PID, fill_color: undefined, outline_color: '#000000', outline_weight: undefined, outline_dash: undefined, content_alignment: 'BOTTOM' };
    await run({ action: updateShapeProperties, propsValue: { ...base, object_id: 'box1' } });
    expect(posts).toEqual([
      {
        requests: [
          {
            updateShapeProperties: {
              objectId: 'box1',
              shapeProperties: {
                outline: { propertyState: 'RENDERED', outlineFill: { solidFill: { color: { rgbColor: { red: 0, green: 0, blue: 0 } }, alpha: 1 } } },
                contentAlignment: 'BOTTOM',
              },
              fields: 'outline.propertyState,outline.outlineFill.solidFill.color,outline.outlineFill.solidFill.alpha,contentAlignment',
            },
          },
        ],
        writeControl: { requiredRevisionId: 'rev1' },
      },
    ]);
    await expect(run({ action: updateShapeProperties, propsValue: { ...base, object_id: 'tbl1' } })).rejects.toThrow(/is a TABLE; this action only changes shapes/);
  });
});

describe('move_resize_element', () => {
  it('keeps the aspect ratio when only the width is given', async () => {
    const output = await run({ action: moveResizeElement, propsValue: { presentation_id: PID, object_id: 'box1', x: undefined, y: undefined, width: 472.44, height: undefined } });
    expect(posts).toEqual([
      {
        requests: [
          {
            updatePageElementTransform: {
              objectId: 'box1',
              applyMode: 'ABSOLUTE',
              transform: { scaleX: expect.closeTo(2, 4), scaleY: expect.closeTo(2, 4), shearX: 0, shearY: 0, translateX: 127000, translateY: 254000, unit: 'EMU' },
            },
          },
        ],
        writeControl: { requiredRevisionId: 'rev1' },
      },
    ]);
    expect(output).toMatchObject({ objectId: 'box1', x: 10, y: 20, width: 472.44, height: 157.48 });
  });

  it('moves a group by its bounding box and refuses group children, tables and rotated resizes', async () => {
    const moved = await run({ action: moveResizeElement, propsValue: { presentation_id: PID, object_id: 'grp1', x: 0, y: 36, width: undefined, height: undefined } });
    expect(moved).toMatchObject({ objectId: 'grp1', x: 0, y: 36, width: 472.44, height: 78.74 });
    expect(posts).toEqual([
      {
        requests: [
          {
            updatePageElementTransform: {
              objectId: 'grp1',
              applyMode: 'ABSOLUTE',
              transform: { scaleX: 1, scaleY: 1, shearX: 0, shearY: 0, translateX: -127000, translateY: 457200, unit: 'EMU' },
            },
          },
        ],
        writeControl: { requiredRevisionId: 'rev1' },
      },
    ]);
    const base = { presentation_id: PID, x: undefined, y: undefined, width: 10, height: undefined };
    await expect(run({ action: moveResizeElement, propsValue: { ...base, object_id: 'child1' } })).rejects.toThrow(/inside the group "grp1"/);
    await expect(run({ action: moveResizeElement, propsValue: { ...base, object_id: 'rot1' } })).rejects.toThrow(/rotated or skewed/);
    await expect(run({ action: moveResizeElement, propsValue: { ...base, object_id: 'tbl1' } })).rejects.toThrow(/is a table: it can only be moved/);
    await expect(run({ action: moveResizeElement, propsValue: { ...base, object_id: 'grp1' } })).rejects.toThrow(/is a group: it can only be moved/);
    await expect(
      run({ action: moveResizeElement, propsValue: { presentation_id: PID, object_id: 'box1', x: undefined, y: undefined, width: undefined, height: undefined } })
    ).rejects.toThrow(/at least one of X, Y/);
  });
});

describe('delete_elements', () => {
  it('deletes a group once when its child is listed too, atomically', async () => {
    const output = await run({ action: deleteElements, propsValue: { presentation_id: PID, object_ids: ['child1', 'grp1', 'box1', 'box1'] } });
    expect(posts).toEqual([
      { requests: [{ deleteObject: { objectId: 'grp1' } }, { deleteObject: { objectId: 'box1' } }], writeControl: { requiredRevisionId: 'rev1' } },
    ]);
    expect(output).toEqual({ presentationId: PID, deletedObjectIds: ['child1', 'grp1', 'box1'], deletedCount: 3, slideObjectIds: ['s1'] });
  });

  it('refuses slides, unknown ids and an empty list', async () => {
    await expect(run({ action: deleteElements, propsValue: { presentation_id: PID, object_ids: ['s2'] } })).rejects.toThrow(/Delete Slide/);
    await expect(run({ action: deleteElements, propsValue: { presentation_id: PID, object_ids: ['box1', 'gone'] } })).rejects.toThrow(/"gone"/);
    await expect(run({ action: deleteElements, propsValue: { presentation_id: PID, object_ids: [] } })).rejects.toThrow(/at least one/);
    expect(posts).toHaveLength(0);
  });
});

describe('tables', () => {
  it('creates and fills a table with a styled header', async () => {
    const output = await run({
      action: createTable,
      propsValue: {
        presentation_id: PID,
        slide_number: undefined,
        slide_object_id: 's1',
        data: TABLE_DATA,
        rows: undefined,
        columns: undefined,
        header_bold: true,
        header_fill_color: '#000000',
        x: undefined,
        y: undefined,
        width: undefined,
        height: undefined,
      },
    });
    const objectId = expect.stringMatching(/^table_[0-9a-f]{32}$/);
    const insert = ({ rowIndex, columnIndex, text }: { rowIndex: number; columnIndex: number; text: string }) => ({
      insertText: { objectId, cellLocation: { rowIndex, columnIndex }, text, insertionIndex: 0 },
    });
    const bold = (columnIndex: number) => ({
      updateTextStyle: { objectId, cellLocation: { rowIndex: 0, columnIndex }, style: { bold: true }, textRange: { type: 'ALL' }, fields: 'bold' },
    });
    expect(posts).toEqual([
      {
        requests: [
          { createTable: { objectId, elementProperties: { pageObjectId: 's1' }, rows: 2, columns: 2 } },
          insert({ rowIndex: 0, columnIndex: 0, text: 'Region' }),
          insert({ rowIndex: 0, columnIndex: 1, text: 'Q1' }),
          insert({ rowIndex: 1, columnIndex: 0, text: 'EMEA' }),
          insert({ rowIndex: 1, columnIndex: 1, text: '12' }),
          bold(0),
          bold(1),
          {
            updateTableCellProperties: {
              objectId,
              tableRange: { location: { rowIndex: 0, columnIndex: 0 }, rowSpan: 1, columnSpan: 2 },
              tableCellProperties: { tableCellBackgroundFill: { solidFill: { color: { rgbColor: { red: 0, green: 0, blue: 0 } }, alpha: 1 } } },
              fields: 'tableCellBackgroundFill.solidFill.color,tableCellBackgroundFill.solidFill.alpha',
            },
          },
        ],
      },
    ]);
    expect(output).toMatchObject({ presentationId: PID, slideObjectId: 's1', tableObjectId: objectId, rows: 2, columns: 2, filledCells: 4 });
  });

  it('appends a row with values and reports the new size', async () => {
    const output = await run({
      action: insertTableRowsOrColumns,
      propsValue: { presentation_id: PID, table_object_id: 'tbl1', dimension: 'ROW', position: undefined, count: undefined, values: ['x', 'y'] },
    });
    expect(posts).toEqual([
      {
        requests: [
          { insertTableRows: { tableObjectId: 'tbl1', cellLocation: { rowIndex: 1, columnIndex: 0 }, insertBelow: true, number: 1 } },
          { insertText: { objectId: 'tbl1', cellLocation: { rowIndex: 2, columnIndex: 0 }, text: 'x', insertionIndex: 0 } },
          { insertText: { objectId: 'tbl1', cellLocation: { rowIndex: 2, columnIndex: 1 }, text: 'y', insertionIndex: 0 } },
        ],
        writeControl: { requiredRevisionId: 'rev1' },
      },
    ]);
    expect(output).toMatchObject({ tableObjectId: 'tbl1', position: 3, count: 1, rows: 3, columns: 2 });
    await expect(
      run({ action: insertTableRowsOrColumns, propsValue: { presentation_id: PID, table_object_id: 'box1', dimension: 'ROW', position: undefined, count: undefined, values: undefined } })
    ).rejects.toThrow(/needs a table/);
  });

  it('deletes a column and refuses emptying the table', async () => {
    const output = await run({
      action: deleteTableRowsOrColumns,
      propsValue: { presentation_id: PID, table_object_id: 'tbl1', dimension: 'COLUMN', position: 2, count: undefined },
    });
    expect(posts).toEqual([
      { requests: [{ deleteTableColumn: { tableObjectId: 'tbl1', cellLocation: { rowIndex: 0, columnIndex: 1 } } }], writeControl: { requiredRevisionId: 'rev1' } },
    ]);
    expect(output).toMatchObject({ rows: 2, columns: 1 });
    await expect(
      run({ action: deleteTableRowsOrColumns, propsValue: { presentation_id: PID, table_object_id: 'tbl1', dimension: 'ROW', position: 1, count: 2 } })
    ).rejects.toThrow(/at least one row/);
    await expect(
      run({ action: deleteTableRowsOrColumns, propsValue: { presentation_id: PID, table_object_id: 'tbl1', dimension: 'DIAGONAL', position: 1, count: 1 } })
    ).rejects.toThrow(/ROW, COLUMN/);
  });
});

describe('set_slide_background', () => {
  it('sets every slide to an image', async () => {
    const output = await run({
      action: setSlideBackground,
      propsValue: { presentation_id: PID, slide_number: undefined, slide_object_id: undefined, all_slides: true, color: undefined, image_url: 'https://example.com/bg.png' },
    });
    const request = (objectId: string) => ({
      updatePageProperties: { objectId, pageProperties: { pageBackgroundFill: { stretchedPictureFill: { contentUrl: 'https://example.com/bg.png' } } }, fields: 'pageBackgroundFill' },
    });
    expect(posts).toEqual([{ requests: [request('s1'), request('s2')], writeControl: { requiredRevisionId: 'rev1' } }]);
    expect(output).toEqual({ presentationId: PID, slideObjectIds: ['s1', 's2'], slideCount: 2, backgroundType: 'IMAGE', color: null, imageUrl: 'https://example.com/bg.png' });
  });

  it('sets one slide to a colour and refuses mixed inputs', async () => {
    const output = await run({
      action: setSlideBackground,
      propsValue: { presentation_id: PID, slide_number: 2, slide_object_id: undefined, all_slides: undefined, color: 'fff', image_url: undefined },
    });
    expect(posts).toEqual([
      {
        requests: [
          { updatePageProperties: { objectId: 's2', pageProperties: { pageBackgroundFill: { solidFill: { color: { rgbColor: { red: 1, green: 1, blue: 1 } }, alpha: 1 } } }, fields: 'pageBackgroundFill' } },
        ],
        writeControl: { requiredRevisionId: 'rev1' },
      },
    ]);
    expect(output).toMatchObject({ color: '#FFFFFF', backgroundType: 'COLOR' });
    await expect(
      run({ action: setSlideBackground, propsValue: { presentation_id: PID, slide_number: 1, slide_object_id: undefined, all_slides: true, color: '#000', image_url: undefined } })
    ).rejects.toThrow(/All Slides is on/);
    await expect(
      run({ action: setSlideBackground, propsValue: { presentation_id: PID, slide_number: 1, slide_object_id: undefined, all_slides: undefined, color: '#000', image_url: 'https://e.com/a.png' } })
    ).rejects.toThrow(/exactly one/);
    await expect(
      run({ action: setSlideBackground, propsValue: { presentation_id: PID, slide_number: 3, slide_object_id: undefined, all_slides: undefined, color: '#000', image_url: undefined } })
    ).rejects.toThrow(/out of range/);
  });
});

describe('insert_video and replace_image', () => {
  it('creates a YouTube video from a URL', async () => {
    const output = await run({
      action: insertVideo,
      propsValue: { presentation_id: PID, slide_number: undefined, slide_object_id: 's1', video: 'https://youtu.be/M7lc1UVf-VE', source: undefined, x: 10, y: 10, width: undefined, height: undefined },
    });
    const objectId = expect.stringMatching(/^video_[0-9a-f]{32}$/);
    expect(posts).toEqual([
      {
        requests: [
          {
            createVideo: {
              objectId,
              source: 'YOUTUBE',
              id: 'M7lc1UVf-VE',
              elementProperties: { pageObjectId: 's1', transform: { scaleX: 1, scaleY: 1, shearX: 0, shearY: 0, translateX: 127000, translateY: 127000, unit: 'EMU' } },
            },
          },
        ],
      },
    ]);
    expect(output).toMatchObject({ slideObjectId: 's1', videoObjectId: objectId, source: 'YOUTUBE', videoId: 'M7lc1UVf-VE' });
  });

  it('replaces an image and refuses non-images', async () => {
    const output = await run({
      action: replaceImage,
      propsValue: { presentation_id: PID, image_object_id: 'img1', image_url: 'https://example.com/new.png', replace_method: undefined },
    });
    expect(posts).toEqual([
      { requests: [{ replaceImage: { imageObjectId: 'img1', url: 'https://example.com/new.png', imageReplaceMethod: 'CENTER_INSIDE' } }], writeControl: { requiredRevisionId: 'rev1' } },
    ]);
    expect(output).toEqual({ presentationId: PID, slideObjectId: 's1', imageObjectId: 'img1', imageUrl: 'https://example.com/new.png', fit: 'CENTER_INSIDE' });
    await expect(
      run({ action: replaceImage, propsValue: { presentation_id: PID, image_object_id: 'box1', image_url: 'https://example.com/new.png', replace_method: undefined } })
    ).rejects.toThrow(/is a SHAPE; this action only replaces images/);
  });
});

describe('error mapping on the read', () => {
  it('maps a 404 on the deck read', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 404, responseBody: { error: { code: 404, message: 'Requested entity was not found.' } } })
    );
    await expect(
      run({ action: insertText, propsValue: { presentation_id: PID, object_id: 'box1', row: undefined, column: undefined, text: 'x', insertion_index: undefined } })
    ).rejects.toThrow('Could not insert the text: not found (404).');
  });
});
