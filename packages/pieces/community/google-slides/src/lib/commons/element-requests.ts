import { slidesElements, Box, ColorChoice, RgbColor, TextRange, TextTarget, VideoRef } from './elements';
import { slidesText } from './presentation-text';

function cellFields(target: TextTarget): Record<string, unknown> {
  return {
    objectId: target.objectId,
    ...(target.cellLocation ? { cellLocation: target.cellLocation } : {}),
  };
}

function solidFill(rgbColor: RgbColor): Record<string, unknown> {
  return { solidFill: { color: { rgbColor }, alpha: 1 } };
}

function appendIndex(text: string): number {
  return text.length > 0 ? text.length - 1 : 0;
}

function buildInsertTextRequest({
  target,
  text,
  insertionIndex,
}: {
  target: TextTarget;
  text: string;
  insertionIndex: number | undefined;
}): { request: Record<string, unknown>; insertedAt: number; newText: string } {
  if (text === '') {
    throw new Error('Text is empty. Give the text to insert.');
  }
  const maxIndex = appendIndex(target.text);
  const index = insertionIndex ?? maxIndex;
  if (index < 0 || index > maxIndex) {
    throw new Error(
      `Insertion Index must be between 0 and ${maxIndex} for "${target.objectId}" (its text has ${maxIndex} character(s)); leave it empty to append.`
    );
  }
  const visible = slidesText.stripTrailingNewlines(target.text);
  return {
    request: { insertText: { ...cellFields(target), text, insertionIndex: index } },
    insertedAt: index,
    newText: slidesText.stripTrailingNewlines(visible.slice(0, index) + text + visible.slice(index)),
  };
}

function buildSetTextRequests({ target, text }: { target: TextTarget; text: string }): Record<string, unknown>[] {
  const current = slidesText.stripTrailingNewlines(target.text);
  if (current === text) {
    return [];
  }
  return [
    ...(current.length > 0 ? [{ deleteText: { ...cellFields(target), textRange: { type: 'ALL' } } }] : []),
    ...(text.length > 0 ? [{ insertText: { ...cellFields(target), text, insertionIndex: 0 } }] : []),
  ];
}

function colorValue(choice: ColorChoice): Record<string, unknown> {
  return choice.kind === 'none' ? {} : { opaqueColor: { rgbColor: choice.rgbColor } };
}

function buildTextStyle(input: TextStyleInput): { style: Record<string, unknown>; fields: string[] } {
  const entries: [string, unknown][] = [
    ...booleanEntries(input),
    ...(input.fontFamily !== undefined ? [['fontFamily', input.fontFamily] satisfies [string, unknown]] : []),
    ...(input.fontSizePt !== undefined
      ? [['fontSize', { magnitude: input.fontSizePt, unit: 'PT' }] satisfies [string, unknown]]
      : []),
    ...(input.textColor !== undefined ? [['foregroundColor', colorValue(input.textColor)] satisfies [string, unknown]] : []),
    ...(input.highlightColor !== undefined
      ? [['backgroundColor', colorValue(input.highlightColor)] satisfies [string, unknown]]
      : []),
    ...(input.link !== undefined
      ? [['link', input.link === null ? undefined : { url: input.link }] satisfies [string, unknown]]
      : []),
  ];
  if (entries.length === 0) {
    throw new Error('Set at least one style to change (e.g. Bold, Font Size, Text Color).');
  }
  return {
    style: Object.fromEntries(entries.filter(([, value]) => value !== undefined)),
    fields: entries.map(([key]) => key),
  };
}

function booleanEntries(input: TextStyleInput): [string, unknown][] {
  return BOOLEAN_STYLES.flatMap((key) => (input[key] !== undefined ? [[key, input[key]] satisfies [string, unknown]] : []));
}

function buildTextStyleRequests({
  target,
  ranges,
  style,
  fields,
}: {
  target: TextTarget;
  ranges: TextRange[];
  style: Record<string, unknown>;
  fields: string[];
}): Record<string, unknown>[] {
  return ranges.map((textRange) => ({
    updateTextStyle: { ...cellFields(target), style, textRange, fields: fields.join(',') },
  }));
}

function buildParagraphRequests({
  target,
  ranges,
  input,
}: {
  target: TextTarget;
  ranges: TextRange[];
  input: ParagraphInput;
}): Record<string, unknown>[] {
  const entries: [string, unknown][] = [
    ...(input.alignment !== undefined ? [['alignment', input.alignment] satisfies [string, unknown]] : []),
    ...(input.lineSpacing !== undefined ? [['lineSpacing', input.lineSpacing] satisfies [string, unknown]] : []),
    ...(input.spaceAbovePt !== undefined
      ? [['spaceAbove', { magnitude: input.spaceAbovePt, unit: 'PT' }] satisfies [string, unknown]]
      : []),
    ...(input.spaceBelowPt !== undefined
      ? [['spaceBelow', { magnitude: input.spaceBelowPt, unit: 'PT' }] satisfies [string, unknown]]
      : []),
  ];
  if (entries.length === 0 && input.bullets === undefined) {
    throw new Error('Set at least one of Alignment, Line Spacing, Space Above, Space Below or Bullets.');
  }
  const styleRequests = entries.length
    ? ranges.map((textRange) => ({
        updateParagraphStyle: {
          ...cellFields(target),
          style: Object.fromEntries(entries),
          textRange,
          fields: entries.map(([key]) => key).join(','),
        },
      }))
    : [];
  const bulletRequests =
    input.bullets === undefined
      ? []
      : ranges.map((textRange) =>
          input.bullets === 'NONE'
            ? { deleteParagraphBullets: { ...cellFields(target), textRange } }
            : { createParagraphBullets: { ...cellFields(target), textRange, bulletPreset: input.bullets } }
        );
  return [...styleRequests, ...bulletRequests];
}

function buildShapeProperties(input: ShapeStyleInput): { shapeProperties: Record<string, unknown>; fields: string[] } {
  const fill = input.fillColor;
  const outlineOff = input.outlineColor?.kind === 'none';
  const outlineSet = input.outlineColor !== undefined || input.outlineWeightPt !== undefined || input.outlineDash !== undefined;
  if (outlineOff && (input.outlineWeightPt !== undefined || input.outlineDash !== undefined)) {
    throw new Error('Outline Color is "none": leave Outline Weight and Outline Dash empty, or pick an outline colour.');
  }
  const outlineColor = input.outlineColor?.kind === 'rgb' ? input.outlineColor.rgbColor : undefined;
  const shapeProperties: Record<string, unknown> = {
    ...(fill
      ? {
          shapeBackgroundFill:
            fill.kind === 'none' ? { propertyState: 'NOT_RENDERED' } : { propertyState: 'RENDERED', ...solidFill(fill.rgbColor) },
        }
      : {}),
    ...(outlineSet
      ? {
          outline: outlineOff
            ? { propertyState: 'NOT_RENDERED' }
            : {
                propertyState: 'RENDERED',
                ...(outlineColor ? { outlineFill: solidFill(outlineColor) } : {}),
                ...(input.outlineWeightPt !== undefined ? { weight: { magnitude: input.outlineWeightPt, unit: 'PT' } } : {}),
                ...(input.outlineDash !== undefined ? { dashStyle: input.outlineDash } : {}),
              },
        }
      : {}),
    ...(input.contentAlignment !== undefined ? { contentAlignment: input.contentAlignment } : {}),
  };
  const fields = [
    ...(fill ? (fill.kind === 'none' ? ['shapeBackgroundFill.propertyState'] : FILL_FIELDS) : []),
    ...(outlineSet ? ['outline.propertyState'] : []),
    ...(outlineColor ? ['outline.outlineFill.solidFill.color', 'outline.outlineFill.solidFill.alpha'] : []),
    ...(!outlineOff && input.outlineWeightPt !== undefined ? ['outline.weight'] : []),
    ...(!outlineOff && input.outlineDash !== undefined ? ['outline.dashStyle'] : []),
    ...(input.contentAlignment !== undefined ? ['contentAlignment'] : []),
  ];
  return { shapeProperties, fields };
}

function buildCreateShapeRequests({
  objectId,
  slideObjectId,
  shapeType,
  box,
  text,
  fillColor,
}: {
  objectId: string;
  slideObjectId: string;
  shapeType: string;
  box: Box;
  text: string | undefined;
  fillColor: ColorChoice | undefined;
}): Record<string, unknown>[] {
  const fill = fillColor ? buildShapeProperties({ fillColor }) : undefined;
  return [
    {
      createShape: {
        objectId,
        shapeType,
        elementProperties: slidesElements.buildElementProperties({ pageObjectId: slideObjectId, box }),
      },
    },
    ...(text ? [{ insertText: { objectId, text, insertionIndex: 0 } }] : []),
    ...(fill ? [{ updateShapeProperties: { objectId, shapeProperties: fill.shapeProperties, fields: fill.fields.join(',') } }] : []),
  ];
}

function readTableData(value: unknown): string[][] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'string' ? parseJsonArray(value) : value;
  if (!Array.isArray(parsed)) {
    throw new Error('Data must be a JSON array of rows, e.g. [["Name","Score"],["Ann","9"]].');
  }
  return parsed.map((row, rowIndex) => {
    if (!Array.isArray(row)) {
      throw new Error(`Data row ${rowIndex + 1} must be an array of cell values, e.g. ["Ann","9"].`);
    }
    return row.map((cell, columnIndex) => cellText({ cell, rowIndex, columnIndex }));
  });
}

function cellText({ cell, rowIndex, columnIndex }: { cell: unknown; rowIndex: number; columnIndex: number }): string {
  if (cell === null || cell === undefined) {
    return '';
  }
  if (typeof cell === 'string' || typeof cell === 'number' || typeof cell === 'boolean') {
    return String(cell);
  }
  throw new Error(`Data cell (row ${rowIndex + 1}, column ${columnIndex + 1}) must be text, a number or a boolean.`);
}

function parseJsonArray(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('Data must be valid JSON: an array of rows, e.g. [["Name","Score"],["Ann","9"]].');
  }
}

function resolveTableSize({
  rows,
  columns,
  data,
}: {
  rows: number | undefined;
  columns: number | undefined;
  data: string[][] | undefined;
}): { rows: number; columns: number } {
  const dataRows = data?.length ?? 0;
  const dataColumns = (data ?? []).reduce((widest, row) => (row.length > widest ? row.length : widest), 0);
  const finalRows = rows ?? dataRows;
  const finalColumns = columns ?? dataColumns;
  if (finalRows < 1 || finalColumns < 1) {
    throw new Error('Set Rows and Columns (at least 1 each), or give Data to size the table from.');
  }
  if (dataRows > finalRows || dataColumns > finalColumns) {
    throw new Error(
      `Data has ${dataRows} row(s) and up to ${dataColumns} column(s), which does not fit a ${finalRows} x ${finalColumns} table. Leave Rows/Columns empty to size the table from Data.`
    );
  }
  return { rows: finalRows, columns: finalColumns };
}

function buildCreateTableRequests({
  objectId,
  slideObjectId,
  rows,
  columns,
  data,
  box,
  headerBold,
  headerFill,
}: {
  objectId: string;
  slideObjectId: string;
  rows: number;
  columns: number;
  data: string[][];
  box: Box;
  headerBold: boolean;
  headerFill: RgbColor | undefined;
}): { requests: Record<string, unknown>[]; filledCells: number } {
  const cells = data.flatMap((row, rowIndex) =>
    row.flatMap((text, columnIndex) => (text === '' ? [] : [{ rowIndex, columnIndex, text }]))
  );
  const insertRequests = cells.map((cell) => ({
    insertText: {
      objectId,
      cellLocation: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
      text: cell.text,
      insertionIndex: 0,
    },
  }));
  const boldRequests = headerBold
    ? cells
        .filter((cell) => cell.rowIndex === 0)
        .map((cell) => ({
          updateTextStyle: {
            objectId,
            cellLocation: { rowIndex: 0, columnIndex: cell.columnIndex },
            style: { bold: true },
            textRange: { type: 'ALL' },
            fields: 'bold',
          },
        }))
    : [];
  const fillRequests = headerFill
    ? [
        {
          updateTableCellProperties: {
            objectId,
            tableRange: { location: { rowIndex: 0, columnIndex: 0 }, rowSpan: 1, columnSpan: columns },
            tableCellProperties: { tableCellBackgroundFill: solidFill(headerFill) },
            fields: 'tableCellBackgroundFill.solidFill.color,tableCellBackgroundFill.solidFill.alpha',
          },
        },
      ]
    : [];
  return {
    requests: [
      {
        createTable: {
          objectId,
          elementProperties: slidesElements.buildElementProperties({ pageObjectId: slideObjectId, box }),
          rows,
          columns,
        },
      },
      ...insertRequests,
      ...boldRequests,
      ...fillRequests,
    ],
    filledCells: cells.length,
  };
}

function buildInsertTableLinesRequests({
  tableObjectId,
  dimension,
  rows,
  columns,
  position,
  count,
  values,
}: {
  tableObjectId: string;
  dimension: TableDimension;
  rows: number;
  columns: number;
  position: number | undefined;
  count: number;
  values: string[] | undefined;
}): { requests: Record<string, unknown>[]; insertedAt: number } {
  const isRow = dimension === 'ROW';
  const total = isRow ? rows : columns;
  const at = position ?? total + 1;
  if (at < 1 || at > total + 1) {
    throw new Error(`Position must be between 1 and ${total + 1} (the table has ${total} ${isRow ? 'row' : 'column'}(s)); leave it empty to add at the end.`);
  }
  if (count < 1 || count > MAX_TABLE_INSERT) {
    throw new Error(`Count must be between 1 and ${MAX_TABLE_INSERT} (Google's limit per request), got ${count}.`);
  }
  const across = isRow ? columns : rows;
  if (values && (count !== 1 || values.length > across)) {
    throw new Error(
      `Values fill one new ${isRow ? 'row' : 'column'}: set Count to 1 and give at most ${across} value(s), got ${values.length}.`
    );
  }
  const before = at <= total;
  const anchor = before ? at - 1 : total - 1;
  const insert = isRow
    ? { insertTableRows: { tableObjectId, cellLocation: { rowIndex: anchor, columnIndex: 0 }, insertBelow: !before, number: count } }
    : { insertTableColumns: { tableObjectId, cellLocation: { rowIndex: 0, columnIndex: anchor }, insertRight: !before, number: count } };
  const fills = (values ?? []).flatMap((text, offset) =>
    text === ''
      ? []
      : [
          {
            insertText: {
              objectId: tableObjectId,
              cellLocation: isRow ? { rowIndex: at - 1, columnIndex: offset } : { rowIndex: offset, columnIndex: at - 1 },
              text,
              insertionIndex: 0,
            },
          },
        ]
  );
  return { requests: [insert, ...fills], insertedAt: at };
}

function buildDeleteTableLinesRequests({
  tableObjectId,
  dimension,
  rows,
  columns,
  position,
  count,
}: {
  tableObjectId: string;
  dimension: TableDimension;
  rows: number;
  columns: number;
  position: number;
  count: number;
}): Record<string, unknown>[] {
  const isRow = dimension === 'ROW';
  const total = isRow ? rows : columns;
  const noun = isRow ? 'row' : 'column';
  if (count < 1) {
    throw new Error(`Count must be at least 1, got ${count}.`);
  }
  if (position < 1 || position + count - 1 > total) {
    throw new Error(`Cannot delete ${count} ${noun}(s) from position ${position}: the table has ${total} ${noun}(s), numbered from 1.`);
  }
  if (count >= total) {
    throw new Error(`A table needs at least one ${noun}. To remove the whole table, use Delete Elements with its object ID.`);
  }
  const location = isRow ? { rowIndex: position - 1, columnIndex: 0 } : { rowIndex: 0, columnIndex: position - 1 };
  return Array.from({ length: count }, () =>
    isRow
      ? { deleteTableRow: { tableObjectId, cellLocation: location } }
      : { deleteTableColumn: { tableObjectId, cellLocation: location } }
  );
}

function buildBackgroundRequests({
  slideObjectIds,
  background,
}: {
  slideObjectIds: string[];
  background: Background;
}): Record<string, unknown>[] {
  const fill =
    background.kind === 'color'
      ? { solidFill: { color: { rgbColor: background.rgbColor }, alpha: 1 } }
      : { stretchedPictureFill: { contentUrl: background.imageUrl } };
  return slideObjectIds.map((objectId) => ({
    updatePageProperties: { objectId, pageProperties: { pageBackgroundFill: fill }, fields: 'pageBackgroundFill' },
  }));
}

function buildCreateVideoRequest({
  objectId,
  slideObjectId,
  video,
  box,
}: {
  objectId: string;
  slideObjectId: string;
  video: VideoRef;
  box: Box;
}): Record<string, unknown> {
  return {
    createVideo: {
      objectId,
      source: video.source,
      id: video.id,
      elementProperties: slidesElements.buildElementProperties({ pageObjectId: slideObjectId, box }),
    },
  };
}

function buildReplaceImageRequest({
  imageObjectId,
  url,
  method,
}: {
  imageObjectId: string;
  url: string;
  method: string;
}): Record<string, unknown> {
  return { replaceImage: { imageObjectId, url, imageReplaceMethod: method } };
}

function isTableDimension(value: unknown): value is TableDimension {
  return value === 'ROW' || value === 'COLUMN';
}

const BOOLEAN_STYLES: BooleanStyle[] = ['bold', 'italic', 'underline', 'strikethrough'];
const FILL_FIELDS = ['shapeBackgroundFill.propertyState', 'shapeBackgroundFill.solidFill.color', 'shapeBackgroundFill.solidFill.alpha'];
const MAX_TABLE_INSERT = 20;

export const SHAPE_TYPES: string[] = [
  'TEXT_BOX',
  'RECTANGLE',
  'ROUND_RECTANGLE',
  'ELLIPSE',
  'TRIANGLE',
  'RIGHT_TRIANGLE',
  'DIAMOND',
  'PENTAGON',
  'HEXAGON',
  'OCTAGON',
  'PARALLELOGRAM',
  'TRAPEZOID',
  'CHEVRON',
  'HOME_PLATE',
  'RIGHT_ARROW',
  'LEFT_ARROW',
  'UP_ARROW',
  'DOWN_ARROW',
  'LEFT_RIGHT_ARROW',
  'STAR_5',
  'HEART',
  'CLOUD',
  'PLUS',
  'DONUT',
  'WEDGE_RECTANGLE_CALLOUT',
  'WEDGE_ROUND_RECTANGLE_CALLOUT',
  'FLOW_CHART_PROCESS',
  'FLOW_CHART_DECISION',
  'FLOW_CHART_TERMINATOR',
];

export const BULLET_PRESETS: string[] = [
  'BULLET_DISC_CIRCLE_SQUARE',
  'BULLET_ARROW_DIAMOND_DISC',
  'BULLET_CHECKBOX',
  'BULLET_STAR_CIRCLE_SQUARE',
  'NUMBERED_DIGIT_ALPHA_ROMAN',
  'NUMBERED_DIGIT_ALPHA_ROMAN_PARENS',
  'NUMBERED_DIGIT_NESTED',
  'NUMBERED_UPPERALPHA_ALPHA_ROMAN',
  'NUMBERED_UPPERROMAN_UPPERALPHA_DIGIT',
  'NONE',
];

export const PARAGRAPH_ALIGNMENTS: string[] = ['START', 'CENTER', 'END', 'JUSTIFIED'];
export const CONTENT_ALIGNMENTS: string[] = ['TOP', 'MIDDLE', 'BOTTOM'];
export const DASH_STYLES: string[] = ['SOLID', 'DOT', 'DASH', 'DASH_DOT', 'LONG_DASH', 'LONG_DASH_DOT'];
export const IMAGE_REPLACE_METHODS: string[] = ['CENTER_INSIDE', 'CENTER_CROP'];
export const TABLE_DIMENSIONS: TableDimension[] = ['ROW', 'COLUMN'];

export const slidesElementRequests = {
  buildInsertTextRequest,
  buildSetTextRequests,
  buildTextStyle,
  buildTextStyleRequests,
  buildParagraphRequests,
  buildShapeProperties,
  buildCreateShapeRequests,
  readTableData,
  resolveTableSize,
  buildCreateTableRequests,
  buildInsertTableLinesRequests,
  buildDeleteTableLinesRequests,
  buildBackgroundRequests,
  buildCreateVideoRequest,
  buildReplaceImageRequest,
  isTableDimension,
};

export type TableDimension = 'ROW' | 'COLUMN';

export type BooleanStyle = 'bold' | 'italic' | 'underline' | 'strikethrough';

export type TextStyleInput = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontFamily?: string;
  fontSizePt?: number;
  textColor?: ColorChoice;
  highlightColor?: ColorChoice;
  link?: string | null;
};

export type ParagraphInput = {
  alignment?: string;
  lineSpacing?: number;
  spaceAbovePt?: number;
  spaceBelowPt?: number;
  bullets?: string;
};

export type ShapeStyleInput = {
  fillColor?: ColorChoice;
  outlineColor?: ColorChoice;
  outlineWeightPt?: number;
  outlineDash?: string;
  contentAlignment?: string;
};

export type Background = { kind: 'color'; rgbColor: RgbColor; hex: string } | { kind: 'image'; imageUrl: string };
