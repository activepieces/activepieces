import { Page, PageElement, Presentation, slidesApi, TextContent } from './common';

function flattenPageElements(elements: PageElement[] | undefined): PageElement[] {
  return (elements ?? []).flatMap((element) => [
    element,
    ...flattenPageElements(element.elementGroup?.children),
  ]);
}

function joinText(text: TextContent | undefined): string {
  return (text?.textElements ?? [])
    .map((element) => element.textRun?.content ?? element.autoText?.content ?? '')
    .join('');
}

function textContainers(elements: PageElement[] | undefined): string[] {
  return flattenPageElements(elements).flatMap((element) => [
    ...(element.shape?.text ? [joinText(element.shape.text)] : []),
    ...(element.table?.tableRows ?? []).flatMap((row) =>
      (row.tableCells ?? []).filter((cell) => cell.text).map((cell) => joinText(cell.text))
    ),
  ]);
}

function discoverPlaceholders({
  presentation,
  format,
}: {
  presentation: Pick<Presentation, 'slides'>;
  format: PlaceholderFormat;
}): string[] {
  const regex = format === '[[]]' ? /\[\[([^\]]+)\]\]/g : /\{\{([^}]+)\}\}/g;
  const names = (presentation.slides ?? []).flatMap((slide) =>
    [
      ...textContainers(slide.pageElements),
      ...textContainers(slide.slideProperties?.notesPage?.pageElements),
    ].flatMap((text) => Array.from(text.matchAll(regex), (match) => match[1]))
  );
  return Array.from(new Set(names));
}

function findSheetsCharts(presentation: Pick<Presentation, 'slides'>): string[] {
  return (presentation.slides ?? []).flatMap((slide) =>
    flattenPageElements(slide.pageElements)
      .filter((element) => element.sheetsChart)
      .map((element) => element.objectId)
  );
}

function stripTrailingNewlines(text: string): string {
  return text.replace(/\n+$/, '');
}

function speakerNotesText(slide: Page): string {
  const notesPage = slide.slideProperties?.notesPage;
  const notesId = notesPage?.notesProperties?.speakerNotesObjectId;
  if (!notesId) {
    return '';
  }
  const shape = (notesPage?.pageElements ?? []).find((element) => element.objectId === notesId);
  return stripTrailingNewlines(joinText(shape?.shape?.text));
}

function elementType(element: PageElement): string {
  if (element.elementGroup) return 'GROUP';
  if (element.sheetsChart) return 'SHEETS_CHART';
  if (element.table) return 'TABLE';
  if (element.image) return 'IMAGE';
  if (element.video) return 'VIDEO';
  if (element.line) return 'LINE';
  if (element.wordArt) return 'WORD_ART';
  if (element.shape) return 'SHAPE';
  return 'OTHER';
}

function elementText(element: PageElement): string | null {
  if (element.shape?.text) {
    return stripTrailingNewlines(joinText(element.shape.text));
  }
  if (element.table) {
    return textContainers([element])
      .map(stripTrailingNewlines)
      .filter((text) => text.length > 0)
      .join(' | ');
  }
  return element.wordArt?.renderedText ?? null;
}

function outlineSlide({
  presentationId,
  slide,
  index,
  layoutNames,
}: {
  presentationId: string;
  slide: Page;
  index: number;
  layoutNames: Map<string, string>;
}): OutlineSlide {
  const elements = flattenPageElements(slide.pageElements).map(
    (element): OutlineElement => ({
      objectId: element.objectId,
      type: elementType(element),
      placeholderType: element.shape?.placeholder?.type ?? null,
      text: elementText(element),
    })
  );
  const titleElement = elements.find(
    (element) => element.placeholderType !== null && TITLE_TYPES.includes(element.placeholderType) && element.text
  );
  const layoutObjectId = slide.slideProperties?.layoutObjectId ?? null;
  return {
    slideNumber: index + 1,
    objectId: slide.objectId,
    slideUrl: slidesApi.slideUrl({ presentationId, slideObjectId: slide.objectId }),
    layoutObjectId,
    layoutName: layoutObjectId ? layoutNames.get(layoutObjectId) ?? null : null,
    isSkipped: slide.slideProperties?.isSkipped ?? false,
    title: titleElement?.text ?? null,
    text: elements
      .filter((element) => element.type !== 'GROUP' && element.text)
      .map((element) => element.text)
      .join('\n'),
    speakerNotes: speakerNotesText(slide),
    elements,
  };
}

function buildOutline(presentation: Presentation): Outline {
  const layoutNames = new Map(
    (presentation.layouts ?? []).flatMap((layout): [string, string][] => {
      const name = layout.layoutProperties?.displayName ?? layout.layoutProperties?.name;
      return name ? [[layout.objectId, name]] : [];
    })
  );
  const slides = (presentation.slides ?? []).map((slide, index) =>
    outlineSlide({ presentationId: presentation.presentationId, slide, index, layoutNames })
  );
  return {
    presentationId: presentation.presentationId,
    title: presentation.title ?? '',
    revisionId: presentation.revisionId ?? null,
    slideCount: slides.length,
    slides,
  };
}

const TITLE_TYPES = ['TITLE', 'CENTERED_TITLE'];

export const slidesText = {
  flattenPageElements,
  elementType,
  elementText,
  stripTrailingNewlines,
  joinText,
  textContainers,
  discoverPlaceholders,
  findSheetsCharts,
  speakerNotesText,
  buildOutline,
};

export type PlaceholderFormat = '{{}}' | '[[]]';

export type OutlineElement = {
  objectId: string;
  type: string;
  placeholderType: string | null;
  text: string | null;
};

export type OutlineSlide = {
  slideNumber: number;
  objectId: string;
  slideUrl: string;
  layoutObjectId: string | null;
  layoutName: string | null;
  isSkipped: boolean;
  title: string | null;
  text: string;
  speakerNotes: string;
  elements: OutlineElement[];
};

export type Outline = {
  presentationId: string;
  title: string;
  revisionId: string | null;
  slideCount: number;
  slides: OutlineSlide[];
};
