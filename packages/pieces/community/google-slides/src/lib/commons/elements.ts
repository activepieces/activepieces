import { AffineTransform, Dimension, PageElement, Presentation, Size, slidesApi } from './common';
import { slidesText } from './presentation-text';
import { slidesRequests } from './requests';

function ptToEmu(pt: number): number {
  return Math.round(pt * EMU_PER_PT);
}

function emuToPt(emu: number): number {
  return Math.round((emu / EMU_PER_PT) * 100) / 100;
}

function dimensionToEmu(dimension: Dimension | undefined): number | undefined {
  if (dimension?.magnitude === undefined) {
    return undefined;
  }
  return dimension.unit === 'PT' ? dimension.magnitude * EMU_PER_PT : dimension.magnitude;
}

function readElementId({ value, label }: { value: unknown; label: string }): string {
  const id = typeof value === 'string' ? value.trim() : '';
  if (!id) {
    throw new Error(`${label} is required. Get element object IDs from List Slide Elements or Get Presentation Outline.`);
  }
  if (!OBJECT_ID.test(id)) {
    throw new Error(`${label} "${id}" is not a valid object ID (letters, digits, "_", "-" and ":" only).`);
  }
  return id;
}

function readElementIds({ value, label }: { value: unknown; label: string }): string[] {
  const items = Array.isArray(value) ? value : value === undefined || value === null || value === '' ? [] : [value];
  const ids = items
    .filter((item) => !(typeof item === 'string' && item.trim() === ''))
    .map((item) => readElementId({ value: item, label }));
  if (ids.length === 0) {
    throw new Error(`${label}: give at least one element object ID.`);
  }
  return Array.from(new Set(ids));
}

function readBoolean({ value, label }: { value: unknown; label: string }): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const text = String(value).trim().toLowerCase();
  if (text === 'true' || text === 'false') {
    return text === 'true';
  }
  throw new Error(`${label} must be true or false, got "${String(value)}".`);
}

function readText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return typeof value === 'string' ? value : String(value);
}

function readEnum({ value, label, allowed }: { value: unknown; label: string; allowed: readonly string[] }): string | undefined {
  const text = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!text) {
    return undefined;
  }
  if (!allowed.includes(text)) {
    throw new Error(`${label} must be one of ${allowed.join(', ')}, got "${String(value)}".`);
  }
  return text;
}

function normaliseHex(value: string): string {
  const hex = value.trim().replace(/^#/, '');
  const full = /^[0-9a-f]{3}$/i.test(hex) ? hex.replace(/./g, (char) => char + char) : hex;
  return `#${full.toUpperCase()}`;
}

function parseHexColor({ value, label }: { value: string; label: string }): RgbColor {
  const full = normaliseHex(value).slice(1);
  if (!/^[0-9a-f]{6}$/i.test(full)) {
    throw new Error(`${label} must be a hex colour like #1A73E8, got "${value}".`);
  }
  const channel = (offset: number) => Math.round((parseInt(full.slice(offset, offset + 2), 16) / 255) * 10000) / 10000;
  return { red: channel(0), green: channel(2), blue: channel(4) };
}

function readColor({ value, label }: { value: unknown; label: string }): ColorChoice | undefined {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) {
    return undefined;
  }
  if (NONE_WORDS.includes(text.toLowerCase())) {
    return { kind: 'none' };
  }
  return { kind: 'rgb', rgbColor: parseHexColor({ value: text, label }) };
}

function readPositive({ value, label }: { value: unknown; label: string }): number | undefined {
  const number = slidesRequests.toNumber({ value, label });
  if (number !== undefined && number <= 0) {
    throw new Error(`${label} must be greater than 0, got ${number}.`);
  }
  return number;
}

function readBox({
  x,
  y,
  width,
  height,
  required,
}: {
  x: unknown;
  y: unknown;
  width: unknown;
  height: unknown;
  required: boolean;
}): Box {
  const left = slidesRequests.toNumber({ value: x, label: 'X (pt)' });
  const top = slidesRequests.toNumber({ value: y, label: 'Y (pt)' });
  const w = readPositive({ value: width, label: 'Width (pt)' });
  const h = readPositive({ value: height, label: 'Height (pt)' });
  if (required && (left === undefined || top === undefined || w === undefined || h === undefined)) {
    throw new Error('Set X, Y, Width and Height in points (a standard 16:9 slide is 720 x 405 pt).');
  }
  if ((left === undefined) !== (top === undefined)) {
    throw new Error('Set both X and Y, or leave both empty.');
  }
  if ((w === undefined) !== (h === undefined)) {
    throw new Error('Set both Width and Height, or leave both empty.');
  }
  return {
    ...(left !== undefined && top !== undefined ? { position: { x: left, y: top } } : {}),
    ...(w !== undefined && h !== undefined ? { size: { width: w, height: h } } : {}),
  };
}

function buildElementProperties({ pageObjectId, box }: { pageObjectId: string; box: Box }): Record<string, unknown> {
  return {
    pageObjectId,
    ...(box.size
      ? {
          size: {
            width: { magnitude: ptToEmu(box.size.width), unit: 'EMU' },
            height: { magnitude: ptToEmu(box.size.height), unit: 'EMU' },
          },
        }
      : {}),
    ...(box.position
      ? {
          transform: {
            scaleX: 1,
            scaleY: 1,
            shearX: 0,
            shearY: 0,
            translateX: ptToEmu(box.position.x),
            translateY: ptToEmu(box.position.y),
            unit: 'EMU',
          },
        }
      : {}),
  };
}

function toMatrix(transform: AffineTransform | undefined): Matrix {
  if (!transform) {
    return IDENTITY;
  }
  const unitFactor = transform.unit === 'PT' ? EMU_PER_PT : 1;
  return {
    a: transform.scaleX ?? 0,
    b: transform.shearY ?? 0,
    c: transform.shearX ?? 0,
    d: transform.scaleY ?? 0,
    e: (transform.translateX ?? 0) * unitFactor,
    f: (transform.translateY ?? 0) * unitFactor,
  };
}

function composeMatrix({ parent, child }: { parent: Matrix; child: Matrix }): Matrix {
  return {
    a: parent.a * child.a + parent.c * child.b,
    b: parent.b * child.a + parent.d * child.b,
    c: parent.a * child.c + parent.c * child.d,
    d: parent.b * child.c + parent.d * child.d,
    e: parent.a * child.e + parent.c * child.f + parent.e,
    f: parent.b * child.e + parent.d * child.f + parent.f,
  };
}

function matrixToTransform(matrix: Matrix): Required<AffineTransform> {
  return {
    scaleX: matrix.a,
    scaleY: matrix.d,
    shearX: matrix.c,
    shearY: matrix.b,
    translateX: Math.round(matrix.e),
    translateY: Math.round(matrix.f),
    unit: 'EMU',
  };
}

function elementGeometry({ matrix, size }: { matrix: Matrix; size: Size | undefined }): ElementGeometry {
  const width = dimensionToEmu(size?.width);
  const height = dimensionToEmu(size?.height);
  return {
    x: emuToPt(matrix.e),
    y: emuToPt(matrix.f),
    width: width === undefined ? null : emuToPt(width * Math.hypot(matrix.a, matrix.b)),
    height: height === undefined ? null : emuToPt(height * Math.hypot(matrix.c, matrix.d)),
    rotationDegrees: rotationOf(matrix),
  };
}

function effectiveSize(element: PageElement): Size | undefined {
  if (!element.table) {
    return element.size;
  }
  const sum = (dimensions: (Dimension | undefined)[]) =>
    dimensions.reduce((total, dimension) => total + (dimensionToEmu(dimension) ?? 0), 0);
  const width = sum((element.table.tableColumns ?? []).map((column) => column.columnWidth));
  const height = sum((element.table.tableRows ?? []).map((row) => row.rowHeight));
  return width > 0 && height > 0
    ? { width: { magnitude: width, unit: 'EMU' }, height: { magnitude: height, unit: 'EMU' } }
    : element.size;
}

function rotationOf(matrix: Matrix): number {
  const rotation = Math.round((Math.atan2(matrix.b, matrix.a) * 180) / Math.PI);
  return rotation === 0 ? 0 : rotation;
}

function groupBounds({ groupId, entries }: { groupId: string; entries: ElementEntry[] }): Bounds | null {
  const corners = entries
    .filter((entry) => entry.ancestorGroupIds.includes(groupId) && !entry.element.elementGroup)
    .flatMap((entry) => {
      const size = effectiveSize(entry.element);
      const width = dimensionToEmu(size?.width) ?? 0;
      const height = dimensionToEmu(size?.height) ?? 0;
      const { a, b, c, d, e, f } = entry.matrix;
      return [
        { x: e, y: f },
        { x: a * width + e, y: b * width + f },
        { x: c * height + e, y: d * height + f },
        { x: a * width + c * height + e, y: b * width + d * height + f },
      ];
    });
  if (corners.length === 0) {
    return null;
  }
  const left = corners.reduce((min, point) => (point.x < min ? point.x : min), Number.POSITIVE_INFINITY);
  const top = corners.reduce((min, point) => (point.y < min ? point.y : min), Number.POSITIVE_INFINITY);
  const right = corners.reduce((max, point) => (point.x > max ? point.x : max), Number.NEGATIVE_INFINITY);
  const bottom = corners.reduce((max, point) => (point.y > max ? point.y : max), Number.NEGATIVE_INFINITY);
  return { left, top, right, bottom };
}

function entryGeometry({ entry, entries }: { entry: ElementEntry; entries: ElementEntry[] }): ElementGeometry {
  if (!entry.element.elementGroup) {
    return elementGeometry({ matrix: entry.matrix, size: effectiveSize(entry.element) });
  }
  const bounds = groupBounds({ groupId: entry.element.objectId, entries });
  if (!bounds) {
    return { ...elementGeometry({ matrix: entry.matrix, size: undefined }) };
  }
  return {
    x: emuToPt(bounds.left),
    y: emuToPt(bounds.top),
    width: emuToPt(bounds.right - bounds.left),
    height: emuToPt(bounds.bottom - bounds.top),
    rotationDegrees: rotationOf(entry.matrix),
  };
}

function flattenWithParents({
  elements,
  parent,
}: {
  elements: PageElement[] | undefined;
  parent: { ancestorGroupIds: string[]; matrix: Matrix };
}): ElementEntry[] {
  return (elements ?? []).flatMap((element) => {
    const matrix = composeMatrix({ parent: parent.matrix, child: toMatrix(element.transform) });
    const parentGroupId = parent.ancestorGroupIds[parent.ancestorGroupIds.length - 1] ?? null;
    return [
      { element, parentGroupId, ancestorGroupIds: parent.ancestorGroupIds, matrix },
      ...flattenWithParents({
        elements: element.elementGroup?.children,
        parent: { ancestorGroupIds: [...parent.ancestorGroupIds, element.objectId], matrix },
      }),
    ];
  });
}

function slideEntries(elements: PageElement[] | undefined): ElementEntry[] {
  return flattenWithParents({ elements, parent: { ancestorGroupIds: [], matrix: IDENTITY } });
}

async function fetchDeck({ accessToken, presentationId }: { accessToken: string; presentationId: string }): Promise<Presentation> {
  return slidesApi.getPresentation({ accessToken, presentationId, fields: DECK_FIELDS });
}

async function loadElement({
  accessToken,
  presentationId,
  objectId,
  action,
}: {
  accessToken: string;
  presentationId: string;
  objectId: string;
  action: string;
}): Promise<LocatedElement> {
  const presentation = await fetchDeck({ accessToken, presentationId }).catch((error: unknown) => {
    throw slidesApi.googleApiError({ error, action });
  });
  return locateElement({ presentation, objectId });
}

async function applyRequests({
  accessToken,
  presentationId,
  requests,
  revisionId,
  action,
}: {
  accessToken: string;
  presentationId: string;
  requests: unknown[];
  revisionId?: string;
  action: string;
}): Promise<void> {
  if (requests.length === 0) {
    return;
  }
  await slidesApi
    .batchUpdate({ accessToken, presentationId, requests, requiredRevisionId: revisionId })
    .catch((error: unknown) => {
      throw slidesApi.googleApiError({ error, action });
    });
}

function locateElement({ presentation, objectId }: { presentation: Presentation; objectId: string }): LocatedElement {
  const slides = presentation.slides ?? [];
  for (const slide of slides) {
    const entries = slideEntries(slide.pageElements);
    const entry = entries.find((candidate) => candidate.element.objectId === objectId);
    if (entry) {
      return {
        ...entry,
        slideEntries: entries,
        slideObjectId: slide.objectId,
        type: slidesText.elementType(entry.element),
        revisionId: presentation.revisionId,
      };
    }
  }
  if (slides.some((slide) => slide.objectId === objectId)) {
    throw new Error(
      `"${objectId}" is a slide, not an element on a slide. Pass element object IDs (from List Slide Elements or Get Presentation Outline elements[].objectId); use the slide actions (e.g. Delete Slide, Set Slide Background) for whole slides.`
    );
  }
  throw new Error(
    `No element with object ID "${objectId}" on any slide of this presentation. Get element object IDs from List Slide Elements or Get Presentation Outline (slides[].elements[].objectId); speaker-notes, layout and master elements are not supported.`
  );
}

function requireType({ located, types, purpose }: { located: LocatedElement; types: string[]; purpose: string }): void {
  if (!types.includes(located.type)) {
    throw new Error(
      `Element "${located.element.objectId}" is ${articleFor(located.type)} ${located.type}; ${purpose}. Use List Slide Elements to see each element's type.`
    );
  }
}

function articleFor(type: string): string {
  return /^[AEIOU]/.test(type) ? 'an' : 'a';
}

function resolveTextTarget({
  located,
  row,
  column,
}: {
  located: LocatedElement;
  row: unknown;
  column: unknown;
}): TextTarget {
  const rowNumber = slidesRequests.toInteger({ value: row, label: 'Row' });
  const columnNumber = slidesRequests.toInteger({ value: column, label: 'Column' });
  const objectId = located.element.objectId;
  if (located.type === 'SHAPE') {
    if (rowNumber !== undefined || columnNumber !== undefined) {
      throw new Error(`Element "${objectId}" is a shape; Row and Column are only for table cells. Leave them empty.`);
    }
    return { objectId, text: slidesText.joinText(located.element.shape?.text) };
  }
  if (located.type === 'TABLE') {
    const { rows, columns } = tableSize(located.element);
    if (rowNumber === undefined || columnNumber === undefined) {
      throw new Error(`Element "${objectId}" is a table (${rows} x ${columns}): set Row and Column (starting at 1) to pick the cell.`);
    }
    if (rowNumber < 1 || rowNumber > rows || columnNumber < 1 || columnNumber > columns) {
      throw new Error(
        `Cell (row ${rowNumber}, column ${columnNumber}) is outside the table "${objectId}", which has ${rows} row(s) and ${columns} column(s). Rows and columns start at 1.`
      );
    }
    const cell = located.element.table?.tableRows?.[rowNumber - 1]?.tableCells?.[columnNumber - 1];
    return {
      objectId,
      cellLocation: { rowIndex: rowNumber - 1, columnIndex: columnNumber - 1 },
      text: slidesText.joinText(cell?.text),
    };
  }
  throw new Error(
    `Element "${objectId}" is ${articleFor(located.type)} ${located.type}; text actions work on shapes, text boxes, placeholders and table cells. Use List Slide Elements to find one.`
  );
}

function tableSize(element: PageElement): { rows: number; columns: number } {
  const tableRows = element.table?.tableRows ?? [];
  return {
    rows: element.table?.rows ?? tableRows.length,
    columns: element.table?.columns ?? tableRows[0]?.tableCells?.length ?? 0,
  };
}

function resolveTextRanges({
  target,
  matchText,
  startIndex,
  endIndex,
}: {
  target: TextTarget;
  matchText: unknown;
  startIndex: unknown;
  endIndex: unknown;
}): TextRange[] {
  const visible = slidesText.stripTrailingNewlines(target.text);
  if (visible.length === 0) {
    throw new Error(`Element "${target.objectId}" has no text yet. Add text with Insert Text or Set Element Text first.`);
  }
  const match = typeof matchText === 'string' && matchText !== '' ? matchText : undefined;
  const start = slidesRequests.toInteger({ value: startIndex, label: 'Start Index' });
  const end = slidesRequests.toInteger({ value: endIndex, label: 'End Index' });
  if (match !== undefined && (start !== undefined || end !== undefined)) {
    throw new Error('Set either Match Text or Start/End Index, not both.');
  }
  if (match !== undefined) {
    const ranges = findOccurrences({ text: visible, match });
    if (ranges.length === 0) {
      throw new Error(`"${match}" does not appear in the text of "${target.objectId}" (match is case-sensitive). Its text is: "${visible.slice(0, 200)}".`);
    }
    return ranges;
  }
  if (start === undefined && end === undefined) {
    return [{ type: 'ALL' }];
  }
  const from = start ?? 0;
  const to = end ?? visible.length;
  if (from < 0 || to > target.text.length || from >= to) {
    throw new Error(
      `Start/End Index must satisfy 0 <= start < end <= ${target.text.length} for "${target.objectId}", got start ${from}, end ${to}.`
    );
  }
  return [{ type: 'FIXED_RANGE', startIndex: from, endIndex: to }];
}

function findOccurrences({ text, match }: { text: string; match: string }): TextRange[] {
  const ranges: TextRange[] = [];
  let index = text.indexOf(match);
  while (index !== -1) {
    ranges.push({ type: 'FIXED_RANGE', startIndex: index, endIndex: index + match.length });
    index = text.indexOf(match, index + match.length);
  }
  return ranges;
}

function computeMoveResize({
  located,
  x,
  y,
  width,
  height,
}: {
  located: LocatedElement;
  x: unknown;
  y: unknown;
  width: unknown;
  height: unknown;
}): MoveResult {
  const objectId = located.element.objectId;
  if (located.parentGroupId) {
    throw new Error(
      `Element "${objectId}" is inside the group "${located.parentGroupId}", whose children are positioned relative to the group. Move the group "${located.parentGroupId}" instead.`
    );
  }
  const left = slidesRequests.toNumber({ value: x, label: 'X (pt)' });
  const top = slidesRequests.toNumber({ value: y, label: 'Y (pt)' });
  const newWidth = readPositive({ value: width, label: 'Width (pt)' });
  const newHeight = readPositive({ value: height, label: 'Height (pt)' });
  if ([left, top, newWidth, newHeight].every((value) => value === undefined)) {
    throw new Error('Set at least one of X, Y, Width or Height (in points).');
  }
  const current = toMatrix(located.element.transform);
  if (located.element.elementGroup) {
    return moveGroup({ located, current, left, top, resize: newWidth !== undefined || newHeight !== undefined });
  }
  if (located.element.table && (newWidth !== undefined || newHeight !== undefined)) {
    throw new Error(
      `Element "${objectId}" is a table: it can only be moved (X/Y) here. Table size comes from its column widths and row heights; change them with Batch Update (updateTableColumnProperties / updateTableRowProperties).`
    );
  }
  const scaled =
    newWidth === undefined && newHeight === undefined
      ? current
      : scaleMatrix({ located, matrix: current, width: newWidth, height: newHeight });
  const matrix = {
    ...scaled,
    e: left === undefined ? current.e : ptToEmu(left),
    f: top === undefined ? current.f : ptToEmu(top),
  };
  return { transform: matrixToTransform(matrix), geometry: elementGeometry({ matrix, size: effectiveSize(located.element) }) };
}

function moveGroup({
  located,
  current,
  left,
  top,
  resize,
}: {
  located: LocatedElement;
  current: Matrix;
  left: number | undefined;
  top: number | undefined;
  resize: boolean;
}): MoveResult {
  const objectId = located.element.objectId;
  const bounds = groupBounds({ groupId: objectId, entries: located.slideEntries });
  if (resize || !bounds) {
    throw new Error(
      `Element "${objectId}" is a group: it can only be moved (X/Y). To resize, resize its elements or use Batch Update.`
    );
  }
  const deltaX = left === undefined ? 0 : ptToEmu(left) - bounds.left;
  const deltaY = top === undefined ? 0 : ptToEmu(top) - bounds.top;
  const matrix = { ...current, e: current.e + deltaX, f: current.f + deltaY };
  return {
    transform: matrixToTransform(matrix),
    geometry: {
      x: emuToPt(bounds.left + deltaX),
      y: emuToPt(bounds.top + deltaY),
      width: emuToPt(bounds.right - bounds.left),
      height: emuToPt(bounds.bottom - bounds.top),
      rotationDegrees: rotationOf(current),
    },
  };
}

function scaleMatrix({
  located,
  matrix,
  width,
  height,
}: {
  located: LocatedElement;
  matrix: Matrix;
  width: number | undefined;
  height: number | undefined;
}): Matrix {
  const objectId = located.element.objectId;
  if (matrix.b !== 0 || matrix.c !== 0) {
    throw new Error(`Element "${objectId}" is rotated or skewed, so it cannot be resized here. Use Batch Update with updatePageElementTransform.`);
  }
  const baseWidth = dimensionToEmu(located.element.size?.width) ?? 0;
  const baseHeight = dimensionToEmu(located.element.size?.height) ?? 0;
  const currentWidth = Math.abs(baseWidth * matrix.a);
  const currentHeight = Math.abs(baseHeight * matrix.d);
  if ((width !== undefined && baseWidth === 0) || (height !== undefined && baseHeight === 0)) {
    throw new Error(`Element "${objectId}" has no width or height to scale (for example a straight line). Only move it, or use Batch Update.`);
  }
  if ((width === undefined && currentWidth === 0) || (height === undefined && currentHeight === 0)) {
    throw new Error(`Element "${objectId}" has a zero width or height, so its aspect ratio cannot be kept. Set both Width and Height.`);
  }
  const widthFactor = width !== undefined ? ptToEmu(width) / currentWidth : ptToEmu(height ?? 0) / currentHeight;
  const heightFactor = height !== undefined ? ptToEmu(height) / currentHeight : widthFactor;
  return { ...matrix, a: matrix.a * widthFactor, d: matrix.d * heightFactor };
}

function readVideo({ value, source }: { value: unknown; source: unknown }): VideoRef {
  const text = typeof value === 'string' ? value.trim() : '';
  const chosen = readEnum({ value: source, label: 'Source', allowed: VIDEO_SOURCES });
  if (!text) {
    throw new Error('Video is required: paste a YouTube or Google Drive video URL, or the video ID.');
  }
  if (/^https?:\/\//i.test(text)) {
    const fromUrl = videoFromUrl(text);
    if (chosen && chosen !== fromUrl.source) {
      throw new Error(`Source is ${chosen} but the URL is a ${fromUrl.source} link. Leave Source empty for URLs.`);
    }
    return fromUrl;
  }
  if (!/^[A-Za-z0-9_-]+$/.test(text)) {
    throw new Error(`"${text}" is not a valid video ID.`);
  }
  if (chosen) {
    return { source: chosen, id: text };
  }
  if (YOUTUBE_ID.test(text)) {
    return { source: 'YOUTUBE', id: text };
  }
  throw new Error(`"${text}" is not an 11-character YouTube ID. For a Google Drive video, set Source to DRIVE or paste its URL.`);
}

function videoFromUrl(text: string): VideoRef {
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error(`"${text}" is not a valid URL.`);
  }
  const host = url.hostname.toLowerCase();
  const youtubeId =
    host === 'youtu.be'
      ? url.pathname.split('/')[1]
      : YOUTUBE_HOSTS.includes(host)
      ? url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1]
      : undefined;
  if (youtubeId && YOUTUBE_ID.test(youtubeId)) {
    return { source: 'YOUTUBE', id: youtubeId };
  }
  const driveId =
    host === 'drive.google.com'
      ? url.pathname.match(/^\/file\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]{10,})/)?.[1] ??
        (url.pathname === '/open' ? url.searchParams.get('id') : null)
      : null;
  if (driveId && /^[A-Za-z0-9_-]{10,}$/.test(driveId)) {
    return { source: 'DRIVE', id: driveId };
  }
  throw new Error(
    `"${text}" is not a YouTube (youtube.com/watch?v=…, youtu.be/…) or Google Drive (drive.google.com/file/d/…) video URL.`
  );
}

const EMU_PER_PT = 12700;
const OBJECT_ID = /^[A-Za-z0-9_:-]+$/;
const NONE_WORDS = ['none', 'transparent'];
const IDENTITY: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
const DECK_FIELDS = 'presentationId,revisionId,pageSize,slides(objectId,pageElements)';
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'];

export const VIDEO_SOURCES: string[] = ['YOUTUBE', 'DRIVE'];

export const slidesElements = {
  ptToEmu,
  emuToPt,
  dimensionToEmu,
  readElementId,
  readElementIds,
  readBoolean,
  readText,
  readEnum,
  normaliseHex,
  parseHexColor,
  readColor,
  readPositive,
  readBox,
  buildElementProperties,
  toMatrix,
  composeMatrix,
  elementGeometry,
  entryGeometry,
  slideEntries,
  fetchDeck,
  loadElement,
  applyRequests,
  locateElement,
  requireType,
  resolveTextTarget,
  tableSize,
  resolveTextRanges,
  computeMoveResize,
  readVideo,
};

export type RgbColor = { red: number; green: number; blue: number };

export type ColorChoice = { kind: 'none' } | { kind: 'rgb'; rgbColor: RgbColor };

export type Box = { position?: { x: number; y: number }; size?: { width: number; height: number } };

export type Matrix = { a: number; b: number; c: number; d: number; e: number; f: number };

export type ElementGeometry = {
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  rotationDegrees: number;
};

export type Bounds = { left: number; top: number; right: number; bottom: number };

export type MoveResult = { transform: Required<AffineTransform>; geometry: ElementGeometry };

export type ElementEntry = {
  element: PageElement;
  parentGroupId: string | null;
  ancestorGroupIds: string[];
  matrix: Matrix;
};

export type LocatedElement = ElementEntry & {
  slideEntries: ElementEntry[];
  slideObjectId: string;
  type: string;
  revisionId?: string;
};

export type TextTarget = {
  objectId: string;
  cellLocation?: { rowIndex: number; columnIndex: number };
  text: string;
};

export type TextRange = { type: 'ALL' } | { type: 'FIXED_RANGE'; startIndex: number; endIndex: number };

export type VideoRef = { source: string; id: string };
