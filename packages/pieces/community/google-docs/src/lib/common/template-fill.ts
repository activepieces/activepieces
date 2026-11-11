import { docs_v1 } from '@googleapis/docs';
import { ImageReplacement } from './image-replacements';

export const templateFill = {
  resolveFormat,
  scan,
  plan,
  summarize,
  imageLabel,
};

function resolveFormat(value: unknown): PlaceholderFormat {
  return typeof value === 'string' && value in PLACEHOLDER_FORMATS ? PLACEHOLDER_FORMATS[value] : DEFAULT_FORMAT;
}

function scan({ document, format }: { document: docs_v1.Schema$Document; format: PlaceholderFormat }): TemplateScan {
  const pattern = placeholderPattern(format);
  const tokensByKey = new Map<string, string[]>();
  const texts: string[] = [];
  const images: TemplateImage[] = [];
  const otherObjects: TemplateObject[] = [];

  listTabs(document).forEach(({ tabId, documentTab }, tabIndex) => {
    const inlineObjects = documentTab.inlineObjects ?? {};
    const positionedObjects = documentTab.positionedObjects ?? {};
    const seenImages = new Set<string>();
    const inFirstTab = tabIndex === 0;

    for (const paragraph of listParagraphs(documentTab)) {
      const elements = paragraph.elements ?? [];
      const text = elements.map((element) => element.textRun?.content ?? '').join('');
      texts.push(text);

      for (const match of text.matchAll(pattern)) {
        const key = match[1].trim();
        if (key.length === 0) {
          continue;
        }
        const tokens = tokensByKey.get(key) ?? [];
        if (!tokens.includes(match[0])) {
          tokens.push(match[0]);
        }
        tokensByKey.set(key, tokens);
      }

      const anchoredObjects = [
        ...elements.flatMap((element) => {
          const objectId = element.inlineObjectElement?.inlineObjectId;
          return objectId ? [{ objectId, embeddedObject: inlineObjects[objectId]?.inlineObjectProperties?.embeddedObject }] : [];
        }),
        ...(paragraph.positionedObjectIds ?? []).map((objectId) => ({
          objectId,
          embeddedObject: positionedObjects[objectId]?.positionedObjectProperties?.embeddedObject,
        })),
      ];

      for (const { objectId, embeddedObject } of anchoredObjects) {
        if (seenImages.has(objectId) || !embeddedObject?.imageProperties) {
          continue;
        }
        seenImages.add(objectId);
        images.push({
          objectId,
          title: embeddedObject.title ?? '',
          description: embeddedObject.description ?? '',
          tabId,
          inFirstTab,
        });
      }
    }

    const otherObjectIds = [...Object.keys(inlineObjects), ...Object.keys(positionedObjects)].filter(
      (objectId) => !seenImages.has(objectId),
    );
    otherObjects.push(...otherObjectIds.map((objectId) => ({ objectId, tabId, inFirstTab })));
  });

  return {
    placeholders: [...tokensByKey.entries()].map(([key, tokens]) => ({ key, tokens })),
    images,
    otherObjects,
    texts,
  };
}

function plan({
  scan: templateScan,
  format,
  values,
  fields,
  images,
  imageFields,
}: {
  scan: TemplateScan;
  format: PlaceholderFormat;
  values?: unknown;
  fields?: unknown;
  images?: ImageReplacement[];
  imageFields?: unknown;
}): FillPlan {
  const merged = { ...withoutEmptyValues(toRecord(fields)), ...toRecord(values) };

  const textTargets = Object.entries(merged).flatMap(([key, value]) =>
    tokensFor({ key, format, scan: templateScan }).map((token) => ({ key, token, replaceText: toText(value) })),
  );

  const missing = Object.keys(merged)
    .filter((key) => {
      const tokens = tokensFor({ key, format, scan: templateScan });
      return !templateScan.texts.some((text) => tokens.some((token) => text.includes(token)));
    })
    .map((key) => canonicalToken({ key, format }));

  const imageRows = [
    ...Object.entries(withoutEmptyValues(toRecord(imageFields))).map(([imageObjectId, url]) => ({
      imageObjectId,
      url: toText(url),
    })),
    ...(images ?? []),
  ];

  const imageRequests = imageRows.flatMap(({ imageObjectId, url }) =>
    resolveImages({ identifier: imageObjectId, format, scan: templateScan }).map((image) => ({
      replaceImage: {
        imageObjectId: image.objectId,
        uri: url,
        ...(image.inFirstTab ? {} : { tabId: image.tabId }),
      },
    })),
  );

  return {
    requests: [
      ...textTargets.map(({ token, replaceText }) => ({
        replaceAllText: { containsText: { text: token, matchCase: true }, replaceText },
      })),
      ...imageRequests,
    ],
    textTargets: textTargets.map(({ key, token }) => ({ key, token })),
    imageRequestCount: imageRequests.length,
    missing,
    format,
  };
}

function summarize({
  scan: templateScan,
  plan: fillPlan,
  replies,
}: {
  scan: TemplateScan;
  plan: FillPlan;
  replies: docs_v1.Schema$Response[];
}): FillSummary {
  const occurrencesByKey = new Map<string, number>();
  fillPlan.textTargets.forEach(({ key }, index) => {
    const changed = replies[index]?.replaceAllText?.occurrencesChanged ?? 0;
    occurrencesByKey.set(key, (occurrencesByKey.get(key) ?? 0) + changed);
  });

  const replacements = [...occurrencesByKey.entries()].map(([key, occurrences]) => ({
    placeholder: canonicalToken({ key, format: fillPlan.format }),
    key,
    occurrences,
  }));

  const filledKeys = new Set([...occurrencesByKey.keys()].map((key) => key.trim()));

  return {
    replacements,
    totalReplacements: replacements.reduce((total, { occurrences }) => total + occurrences, 0),
    placeholdersNotFound: replacements.filter(({ occurrences }) => occurrences === 0).map(({ placeholder }) => placeholder),
    unfilledPlaceholders: templateScan.placeholders
      .filter(({ key }) => !filledKeys.has(key))
      .map(({ tokens }) => tokens[0]),
    imagesReplaced: fillPlan.imageRequestCount,
  };
}

function imageLabel({ image, index }: { image: TemplateImage; index: number }): string {
  const altText = image.title.trim() || image.description.trim();
  return altText.length > 0 ? `Image ${index + 1}: ${altText}` : `Image ${index + 1}`;
}

function listTabs(document: docs_v1.Schema$Document): TabContent[] {
  if (!document.tabs || document.tabs.length === 0) {
    return [{ tabId: '', documentTab: document }];
  }
  return document.tabs.flatMap(flattenTab);
}

function flattenTab(tab: docs_v1.Schema$Tab): TabContent[] {
  const own = tab.documentTab ? [{ tabId: tab.tabProperties?.tabId ?? '', documentTab: tab.documentTab }] : [];
  return [...own, ...(tab.childTabs ?? []).flatMap(flattenTab)];
}

function listParagraphs(documentTab: TabContent['documentTab']): docs_v1.Schema$Paragraph[] {
  const segments = [
    documentTab.body?.content,
    ...Object.values(documentTab.headers ?? {}).map((header) => header.content),
    ...Object.values(documentTab.footers ?? {}).map((footer) => footer.content),
    ...Object.values(documentTab.footnotes ?? {}).map((footnote) => footnote.content),
  ];
  return segments.flatMap((content) => paragraphsIn(content ?? []));
}

function paragraphsIn(content: docs_v1.Schema$StructuralElement[]): docs_v1.Schema$Paragraph[] {
  return content.flatMap((element) => {
    if (element.paragraph) {
      return [element.paragraph];
    }
    if (element.table) {
      return (element.table.tableRows ?? []).flatMap((row) =>
        (row.tableCells ?? []).flatMap((cell) => paragraphsIn(cell.content ?? [])),
      );
    }
    if (element.tableOfContents) {
      return paragraphsIn(element.tableOfContents.content ?? []);
    }
    return [];
  });
}

function placeholderPattern(format: PlaceholderFormat): RegExp {
  const [open, close] = format.split('KEY');
  const openChar = escapeForRegExp(open[0]);
  const closeChar = escapeForRegExp(close[0]);
  const key = `([^${openChar}${closeChar}\\n]{1,${MAX_KEY_LENGTH}}?)`;
  if (open.length === 1) {
    return new RegExp(`(?<!${openChar})${openChar}${key}${closeChar}(?!${closeChar})`, 'g');
  }
  return new RegExp(`${escapeForRegExp(open)}${key}${escapeForRegExp(close)}`, 'g');
}

function escapeForRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function canonicalToken({ key, format }: { key: string; format: PlaceholderFormat }): string {
  return format.replace('KEY', key);
}

function tokensFor({ key, format, scan: templateScan }: { key: string; format: PlaceholderFormat; scan: TemplateScan }): string[] {
  const variants = templateScan.placeholders.find((placeholder) => placeholder.key === key.trim())?.tokens ?? [];
  return [...new Set([canonicalToken({ key, format }), ...variants])];
}

function resolveImages({
  identifier,
  format,
  scan: templateScan,
}: {
  identifier: string;
  format: PlaceholderFormat;
  scan: TemplateScan;
}): TemplateObject[] {
  const byObjectId = templateScan.images.filter((image) => image.objectId === identifier);
  if (byObjectId.length > 0) {
    return byObjectId;
  }
  const name = normalizeAltText({ text: identifier, format });
  const byAltText = templateScan.images.filter((image) =>
    [image.title, image.description].some((altText) => name.length > 0 && normalizeAltText({ text: altText, format }) === name),
  );
  if (byAltText.length > 0) {
    return byAltText;
  }
  const byOtherObjectId = templateScan.otherObjects.filter((object) => object.objectId === identifier);
  if (byOtherObjectId.length > 0) {
    return byOtherObjectId;
  }
  throw new Error(
    `Image "${identifier}" was not found in the document. Use the image's alt text (in Google Docs: right-click the image, then Alt text) or its object ID.`,
  );
}

function normalizeAltText({ text, format }: { text: string; format: PlaceholderFormat }): string {
  const [open, close] = format.split('KEY');
  const trimmed = text.trim();
  const unwrapped =
    trimmed.startsWith(open) && trimmed.endsWith(close) && trimmed.length > open.length + close.length
      ? trimmed.slice(open.length, trimmed.length - close.length)
      : trimmed;
  return unwrapped.trim().toLowerCase();
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    return toRecord(parseJson(value));
  }
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? { ...value } : {};
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function withoutEmptyValues(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== null && value !== undefined && value !== ''),
  );
}

function toText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

const PLACEHOLDER_FORMATS: Record<string, PlaceholderFormat> = {
  curly_braces: '{{KEY}}',
  square_brackets: '[[KEY]]',
  single_curly: '{KEY}',
  single_square: '[KEY]',
  '{{KEY}}': '{{KEY}}',
  '[[KEY]]': '[[KEY]]',
  '{KEY}': '{KEY}',
  '[KEY]': '[KEY]',
};

const DEFAULT_FORMAT: PlaceholderFormat = '[[KEY]]';

const MAX_KEY_LENGTH = 200;

type TabContent = {
  tabId: string;
  documentTab: Pick<
    docs_v1.Schema$DocumentTab,
    'body' | 'headers' | 'footers' | 'footnotes' | 'inlineObjects' | 'positionedObjects'
  >;
};

export type PlaceholderFormat = '{{KEY}}' | '[[KEY]]' | '{KEY}' | '[KEY]';

export type TemplateObject = {
  objectId: string;
  tabId: string;
  inFirstTab: boolean;
};

export type TemplateImage = TemplateObject & {
  title: string;
  description: string;
};

export type TemplateScan = {
  placeholders: { key: string; tokens: string[] }[];
  images: TemplateImage[];
  otherObjects: TemplateObject[];
  texts: string[];
};

export type FillPlan = {
  requests: docs_v1.Schema$Request[];
  textTargets: { key: string; token: string }[];
  imageRequestCount: number;
  missing: string[];
  format: PlaceholderFormat;
};

export type FillSummary = {
  replacements: { placeholder: string; key: string; occurrences: number }[];
  totalReplacements: number;
  placeholdersNotFound: string[];
  unfilledPlaceholders: string[];
  imagesReplaced: number;
};
