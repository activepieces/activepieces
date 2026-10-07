import { Page, PageElement, PRESENTATION_MIME_TYPE, slidesApi } from './common';
import { slidesIds } from './ids';

function toInteger({ value, label }: { value: unknown; label: string }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const number = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(number)) {
    throw new Error(`${label} must be a whole number, got "${String(value)}".`);
  }
  return number;
}

function toNumber({ value, label }: { value: unknown; label: string }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const number = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(number)) {
    throw new Error(`${label} must be a number, got "${String(value)}".`);
  }
  return number;
}

function readSlideSelector({
  slideNumber,
  slideObjectId,
}: {
  slideNumber: unknown;
  slideObjectId: unknown;
}): SlideSelector {
  const number = toInteger({ value: slideNumber, label: 'Slide Number' });
  const hasObjectId = typeof slideObjectId === 'string' && slideObjectId.trim() !== '';
  if (number === undefined && !hasObjectId) {
    throw new Error('Choose the slide: set either Slide Number or Slide Object ID.');
  }
  if (number !== undefined && hasObjectId) {
    throw new Error('Set only one of Slide Number or Slide Object ID, not both.');
  }
  if (number !== undefined) {
    if (number < 1) {
      throw new Error('Slide Number starts at 1 (the first slide).');
    }
    return { slideNumber: number };
  }
  return { slideObjectId: slidesIds.parseObjectId(slideObjectId) };
}

function resolveSlide({
  slides,
  selector,
}: {
  slides: Pick<Page, 'objectId'>[];
  selector: SlideSelector;
}): SlideRef {
  if (selector.slideNumber !== undefined) {
    if (selector.slideNumber > slides.length) {
      throw new Error(
        `Slide Number ${selector.slideNumber} is out of range: the presentation has ${slides.length} slide(s).`
      );
    }
    const index = selector.slideNumber - 1;
    return { objectId: slides[index].objectId, index };
  }
  const index = slides.findIndex((slide) => slide.objectId === selector.slideObjectId);
  if (index === -1) {
    throw new Error(
      `No slide with object ID "${selector.slideObjectId}" in this presentation. Use Get Presentation Outline to list slide object IDs.`
    );
  }
  return { objectId: slides[index].objectId, index };
}

async function lookupSlide({
  accessToken,
  presentationId,
  selector,
}: {
  accessToken: string;
  presentationId: string;
  selector: SlideSelector;
}): Promise<SlideLookup> {
  if (selector.slideObjectId) {
    return { objectId: selector.slideObjectId };
  }
  const presentation = await slidesApi.getPresentation({ accessToken, presentationId, fields: FIELD_MASKS.slideIds });
  return {
    objectId: resolveSlide({ slides: presentation.slides ?? [], selector }).objectId,
    revisionId: presentation.revisionId,
  };
}

function readPosition({ position, maxPosition }: { position: unknown; maxPosition: number }): number | undefined {
  const value = toInteger({ value: position, label: 'Position' });
  if (value === undefined) {
    return undefined;
  }
  if (value < 1 || value > maxPosition) {
    throw new Error(`Position must be between 1 and ${maxPosition}, got ${value}.`);
  }
  return value - 1;
}

function moveInsertionIndex({ currentIndex, targetIndex }: { currentIndex: number; targetIndex: number }): number {
  return targetIndex > currentIndex ? targetIndex + 1 : targetIndex;
}

function findPlaceholder({
  elements,
  types,
}: {
  elements: PageElement[] | undefined;
  types: string[];
}): LayoutPlaceholder | null {
  const placeholders = (elements ?? []).flatMap((element) =>
    element.shape?.placeholder?.type ? [element.shape.placeholder] : []
  );
  const type = types.find((candidate) => placeholders.some((placeholder) => placeholder.type === candidate));
  if (!type) {
    return null;
  }
  const lowestIndex = placeholders
    .filter((placeholder) => placeholder.type === type)
    .reduce((lowest, placeholder) => Math.min(lowest, placeholder.index ?? 0), Number.POSITIVE_INFINITY);
  return { type, index: lowestIndex };
}

function buildAddSlideRequests({
  layouts,
  predefinedLayout,
  insertionIndex,
  title,
  body,
  newId,
}: {
  layouts: Page[];
  predefinedLayout: string;
  insertionIndex?: number;
  title?: string;
  body?: string;
  newId: (prefix: string) => string;
}): AddSlideRequests {
  const layout = layouts.find((candidate) => candidate.layoutProperties?.name === predefinedLayout);
  if (!layout) {
    const available = layouts.flatMap((candidate) =>
      candidate.layoutProperties?.name ? [candidate.layoutProperties.name] : []
    );
    throw new Error(
      `This presentation's theme has no "${predefinedLayout}" layout. Available layouts: ${available.join(', ') || 'none'}.`
    );
  }
  const wantsTitle = title !== undefined && title !== '';
  const wantsBody = body !== undefined && body !== '';
  const titlePlaceholder = wantsTitle ? findPlaceholder({ elements: layout.pageElements, types: TITLE_PLACEHOLDERS }) : null;
  const bodyPlaceholder = wantsBody ? findPlaceholder({ elements: layout.pageElements, types: BODY_PLACEHOLDERS }) : null;
  if (wantsTitle && !titlePlaceholder) {
    throw new Error(`The "${predefinedLayout}" layout has no title placeholder. Pick another layout or leave Title empty.`);
  }
  if (wantsBody && !bodyPlaceholder) {
    throw new Error(
      `The "${predefinedLayout}" layout has no body or subtitle placeholder. Pick another layout or leave Body empty.`
    );
  }
  const slideObjectId = newId('slide');
  const fills = [
    ...(titlePlaceholder && wantsTitle ? [{ placeholder: titlePlaceholder, objectId: newId('title'), text: title }] : []),
    ...(bodyPlaceholder && wantsBody ? [{ placeholder: bodyPlaceholder, objectId: newId('body'), text: body }] : []),
  ];
  const createSlide = {
    createSlide: {
      objectId: slideObjectId,
      ...(insertionIndex !== undefined ? { insertionIndex } : {}),
      slideLayoutReference: { layoutId: layout.objectId },
      ...(fills.length > 0
        ? { placeholderIdMappings: fills.map((fill) => ({ layoutPlaceholder: fill.placeholder, objectId: fill.objectId })) }
        : {}),
    },
  };
  return {
    requests: [
      createSlide,
      ...fills.map((fill) => ({ insertText: { objectId: fill.objectId, text: fill.text, insertionIndex: 0 } })),
    ],
    slideObjectId,
    titleObjectId: titlePlaceholder ? fills[0].objectId : null,
    bodyObjectId: bodyPlaceholder ? fills[fills.length - 1].objectId : null,
  };
}

function buildDuplicateRequests({
  sourceObjectId,
  sourceIndex,
  newObjectId,
  targetIndex,
}: {
  sourceObjectId: string;
  sourceIndex: number;
  newObjectId: string;
  targetIndex?: number;
}): { requests: unknown[]; finalIndex: number } {
  const duplicate = { duplicateObject: { objectId: sourceObjectId, objectIds: { [sourceObjectId]: newObjectId } } };
  const duplicateIndex = sourceIndex + 1;
  if (targetIndex === undefined || targetIndex === duplicateIndex) {
    return { requests: [duplicate], finalIndex: duplicateIndex };
  }
  return {
    requests: [
      duplicate,
      {
        updateSlidesPosition: {
          slideObjectIds: [newObjectId],
          insertionIndex: moveInsertionIndex({ currentIndex: duplicateIndex, targetIndex }),
        },
      },
    ],
    finalIndex: targetIndex,
  };
}

function buildSpeakerNotesRequests({
  speakerNotesObjectId,
  currentNotes,
  notes,
}: {
  speakerNotesObjectId: string;
  currentNotes: string;
  notes: string;
}): unknown[] {
  if (currentNotes === notes) {
    return [];
  }
  return [
    ...(currentNotes.length > 0
      ? [{ deleteText: { objectId: speakerNotesObjectId, textRange: { type: 'ALL' } } }]
      : []),
    ...(notes.length > 0 ? [{ insertText: { objectId: speakerNotesObjectId, text: notes, insertionIndex: 0 } }] : []),
  ];
}

function readImageGeometry({
  x,
  y,
  width,
  height,
}: {
  x?: unknown;
  y?: unknown;
  width?: unknown;
  height?: unknown;
}): ImageGeometry {
  const left = toNumber({ value: x, label: 'X' });
  const top = toNumber({ value: y, label: 'Y' });
  const w = toNumber({ value: width, label: 'Width' });
  const h = toNumber({ value: height, label: 'Height' });
  if ((w === undefined) !== (h === undefined)) {
    throw new Error('Set both Width and Height, or leave both empty.');
  }
  if ((left === undefined) !== (top === undefined)) {
    throw new Error('Set both X and Y, or leave both empty.');
  }
  if ((w !== undefined && w <= 0) || (h !== undefined && h <= 0)) {
    throw new Error('Width and Height must be greater than 0.');
  }
  return {
    ...(w !== undefined && h !== undefined
      ? { size: { width: { magnitude: w, unit: 'PT' }, height: { magnitude: h, unit: 'PT' } } }
      : {}),
    ...(left !== undefined && top !== undefined
      ? { transform: { scaleX: 1, scaleY: 1, shearX: 0, shearY: 0, translateX: left, translateY: top, unit: 'PT' } }
      : {}),
  };
}

function buildCreateImageRequest({
  objectId,
  slideObjectId,
  url,
  geometry,
}: {
  objectId: string;
  slideObjectId: string;
  url: string;
  geometry: ImageGeometry;
}): unknown {
  return {
    createImage: {
      objectId,
      url,
      elementProperties: { pageObjectId: slideObjectId, ...geometry },
    },
  };
}

function readSlideObjectIds(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const items = Array.isArray(value) ? value : [value];
  const ids = items
    .filter((item) => !(typeof item === 'string' && item.trim() === ''))
    .map((item) => slidesIds.parseObjectId(item));
  return ids.length > 0 ? ids : undefined;
}

function buildReplaceTextRequest({
  find,
  replaceWith,
  matchCase,
  pageObjectIds,
}: {
  find: string;
  replaceWith: string;
  matchCase: boolean;
  pageObjectIds?: string[];
}): unknown {
  return {
    replaceAllText: {
      containsText: { text: find, matchCase },
      replaceText: replaceWith,
      ...(pageObjectIds ? { pageObjectIds } : {}),
    },
  };
}

function buildReplaceShapesRequest({
  find,
  imageUrl,
  replaceMethod,
  matchCase,
  pageObjectIds,
}: {
  find: string;
  imageUrl: string;
  replaceMethod: string;
  matchCase: boolean;
  pageObjectIds?: string[];
}): unknown {
  return {
    replaceAllShapesWithImage: {
      containsText: { text: find, matchCase },
      imageUrl,
      imageReplaceMethod: replaceMethod,
      ...(pageObjectIds ? { pageObjectIds } : {}),
    },
  };
}

function occurrencesChanged({
  replies,
  key,
}: {
  replies: Record<string, unknown>[] | undefined;
  key: 'replaceAllText' | 'replaceAllShapesWithImage';
}): number {
  const reply = replies?.[0]?.[key];
  if (typeof reply !== 'object' || reply === null || !('occurrencesChanged' in reply)) {
    return 0;
  }
  return Number(reply.occurrencesChanged) || 0;
}

function toPlaceholder({ name, format }: { name: string; format: string }): string {
  return format === '[[]]' ? `[[${name}]]` : `{{${name}}}`;
}

function buildTemplateRequests({
  tableData,
  format,
}: {
  tableData: Record<string, unknown>;
  format: string;
}): unknown[] {
  return Object.entries(tableData).map(([key, value]) => ({
    replaceAllText: {
      containsText: { text: toPlaceholder({ name: key, format }), matchCase: true },
      replaceText: value === undefined || value === null ? '' : String(value),
    },
  }));
}

function escapeDriveQueryLiteral(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function buildFindQuery({ nameContains, folderId }: { nameContains?: string; folderId?: string }): string {
  return [
    `mimeType='${PRESENTATION_MIME_TYPE}'`,
    'trashed=false',
    ...(nameContains ? [`name contains '${escapeDriveQueryLiteral(nameContains)}'`] : []),
    ...(folderId ? [`'${escapeDriveQueryLiteral(folderId)}' in parents`] : []),
  ].join(' and ');
}

function exportFileName({ baseName, extension }: { baseName: string; extension: string }): string {
  const safe = baseName.replace(/[\\/:*?"<>|\r\n]+/g, '_').trim() || 'presentation';
  return safe.toLowerCase().endsWith(`.${extension}`) ? safe : `${safe}.${extension}`;
}

function readBatchRequests(value: unknown): Record<string, unknown>[] {
  const parsed = typeof value === 'string' ? parseJson(value) : value;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Requests must be a non-empty JSON array, e.g. [{"deleteObject":{"objectId":"g123_0_1"}}].');
  }
  return parsed.map((request, index) => {
    if (!isSingleKeyObject(request)) {
      throw new Error(`Request #${index + 1} must be an object with exactly one request kind, e.g. {"createSlide":{}}.`);
    }
    return request;
  });
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('Requests must be a JSON array of Slides API request objects.');
  }
}

function isSingleKeyObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 1;
}

const TITLE_PLACEHOLDERS = ['TITLE', 'CENTERED_TITLE'];
const BODY_PLACEHOLDERS = ['BODY', 'SUBTITLE'];

export const PREDEFINED_LAYOUTS = [
  { label: 'Title and body', value: 'TITLE_AND_BODY' },
  { label: 'Title slide (title and subtitle)', value: 'TITLE' },
  { label: 'Title only', value: 'TITLE_ONLY' },
  { label: 'Title and two columns', value: 'TITLE_AND_TWO_COLUMNS' },
  { label: 'Section header', value: 'SECTION_HEADER' },
  { label: 'Section title and description', value: 'SECTION_TITLE_AND_DESCRIPTION' },
  { label: 'One column text', value: 'ONE_COLUMN_TEXT' },
  { label: 'Main point', value: 'MAIN_POINT' },
  { label: 'Big number', value: 'BIG_NUMBER' },
  { label: 'Caption only', value: 'CAPTION_ONLY' },
  { label: 'Blank', value: 'BLANK' },
];

export const EXPORT_FORMATS: Record<string, { mimeType: string; extension: string }> = {
  pdf: { mimeType: 'application/pdf', extension: 'pdf' },
  pptx: {
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extension: 'pptx',
  },
  odp: { mimeType: 'application/vnd.oasis.opendocument.presentation', extension: 'odp' },
  txt: { mimeType: 'text/plain', extension: 'txt' },
};

export const FIELD_MASKS = {
  slideIds: 'revisionId,slides(objectId)',
  addSlide:
    'presentationId,revisionId,slides(objectId),layouts(objectId,layoutProperties(name),pageElements(objectId,shape(placeholder)))',
  outline:
    'presentationId,title,revisionId,layouts(objectId,layoutProperties(name,displayName)),slides(objectId,pageElements,slideProperties(layoutObjectId,isSkipped,notesPage(notesProperties,pageElements)))',
  speakerNotes:
    'revisionId,slides(objectId,slideProperties(notesPage(notesProperties,pageElements(objectId,shape(text)))))',
  charts: 'presentationId,revisionId,slides(objectId,pageElements)',
};

export const slidesRequests = {
  toInteger,
  toNumber,
  readSlideSelector,
  resolveSlide,
  lookupSlide,
  readPosition,
  moveInsertionIndex,
  buildAddSlideRequests,
  buildDuplicateRequests,
  buildSpeakerNotesRequests,
  readImageGeometry,
  buildCreateImageRequest,
  readSlideObjectIds,
  buildReplaceTextRequest,
  buildReplaceShapesRequest,
  occurrencesChanged,
  toPlaceholder,
  buildTemplateRequests,
  escapeDriveQueryLiteral,
  buildFindQuery,
  exportFileName,
  readBatchRequests,
};

export type SlideSelector = { slideNumber?: number; slideObjectId?: string };

export type SlideRef = { objectId: string; index: number };

export type SlideLookup = { objectId: string; revisionId?: string };

export type ImageGeometry = {
  size?: { width: { magnitude: number; unit: string }; height: { magnitude: number; unit: string } };
  transform?: Record<string, number | string>;
};

type LayoutPlaceholder = { type: string; index: number };

type AddSlideRequests = {
  requests: unknown[];
  slideObjectId: string;
  titleObjectId: string | null;
  bodyObjectId: string | null;
};
