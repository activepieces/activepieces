import type { DocumentAiDocument, Layout, RawEntity, RawPage, TextAnchor } from './client';

export function mimeTypeFor({ explicit, names }: { explicit: string | undefined; names: (string | undefined)[] }): string {
  const given = String(explicit ?? '').trim();
  if (given !== '') return given;
  for (const name of names) {
    const ext = extensionOf(String(name ?? '').trim());
    if (ext && MIME_BY_EXTENSION[ext]) return MIME_BY_EXTENSION[ext];
  }
  throw new Error(
    `Could not tell the file type from the name; fill in MIME Type (one of ${[...new Set(Object.values(MIME_BY_EXTENSION))].join(', ')}).`
  );
}

export function parsePageSelection(value: string | undefined): number[] | undefined {
  const text = String(value ?? '').trim();
  if (text === '') return undefined;
  const pages = new Set<number>();
  for (const part of text.split(',')) {
    const piece = part.trim();
    if (piece === '') continue;
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(piece);
    const single = /^\d+$/.test(piece);
    if (!range && !single) {
      throw new Error(`Pages must be numbers or ranges like "1,3-5"; got "${piece}".`);
    }
    const [from, to] = range ? [Number(range[1]), Number(range[2])] : [Number(piece), Number(piece)];
    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to)) {
      throw new Error(`Invalid page "${piece}": the page number is too large.`);
    }
    if (from < 1 || to < from) {
      throw new Error(`Invalid page range "${piece}": pages start at 1 and ranges go upwards.`);
    }
    for (let p = from; p <= to; p++) {
      pages.add(p);
      if (pages.size > MAX_SELECTED_PAGES) {
        throw new Error(
          `Too many pages selected: pick at most ${MAX_SELECTED_PAGES} (online processing takes up to 15 pages, 30 with Imageless Mode). For longer documents use Custom API Call with batchProcess.`
        );
      }
    }
  }
  return [...pages].sort((a, b) => a - b);
}

export function textOf({ chars, anchor }: { chars: string[]; anchor: TextAnchor | undefined }): string {
  if (!anchor) return '';
  if (anchor.content) return anchor.content.trim();
  const segments = anchor.textSegments ?? [];
  if (segments.length === 0 || chars.length === 0) return '';
  return segments
    .map((s) => chars.slice(Number(s.startIndex ?? 0), Number(s.endIndex ?? chars.length)).join(''))
    .join('')
    .trim();
}

export function splitDocumentText(text: string | undefined): string[] {
  return Array.from(text ?? '');
}

export function flattenEntities({ entities, chars }: { entities: RawEntity[] | undefined; chars: string[] }): FlatEntity[] {
  if (!Array.isArray(entities)) return [];
  return entities.map((e) => {
    const { text: normalizedText, ...rest } = e.normalizedValue ?? {};
    const pageRef = e.pageAnchor?.pageRefs?.[0];
    return {
      type: e.type ?? '',
      mentionText: e.mentionText ?? textOf({ chars, anchor: e.textAnchor }),
      confidence: typeof e.confidence === 'number' ? e.confidence : null,
      normalizedText: typeof normalizedText === 'string' ? normalizedText : null,
      normalizedValue: e.normalizedValue ? { ...rest, ...(normalizedText !== undefined ? { text: normalizedText } : {}) } : null,
      id: e.id ?? null,
      page: pageRef === undefined ? null : Number(pageRef.page ?? 0) + 1,
      properties: flattenEntities({ entities: e.properties, chars }),
    };
  });
}

export function formFieldsOf({ pages, chars }: { pages: RawPage[] | undefined; chars: string[] }): FormField[] {
  if (!Array.isArray(pages)) return [];
  return pages.flatMap((page, index) =>
    (page.formFields ?? []).map((f) => ({
      page: page.pageNumber ?? index + 1,
      name: textOf({ chars, anchor: f.fieldName?.textAnchor }),
      value: textOf({ chars, anchor: f.fieldValue?.textAnchor }),
      nameConfidence: typeof f.fieldName?.confidence === 'number' ? f.fieldName.confidence : null,
      valueConfidence: typeof f.fieldValue?.confidence === 'number' ? f.fieldValue.confidence : null,
      valueType: f.valueType ?? null,
    }))
  );
}

export function tablesOf({ pages, chars }: { pages: RawPage[] | undefined; chars: string[] }): Table[] {
  if (!Array.isArray(pages)) return [];
  return pages.flatMap((page, index) =>
    (page.tables ?? []).map((t) => ({
      page: page.pageNumber ?? index + 1,
      headerRows: rowsToText({ rows: t.headerRows, chars }),
      bodyRows: rowsToText({ rows: t.bodyRows, chars }),
    }))
  );
}

export function languagesOf(pages: RawPage[] | undefined): DetectedLanguage[] {
  if (!Array.isArray(pages)) return [];
  const best = new Map<string, number | null>();
  for (const page of pages) {
    for (const lang of page.detectedLanguages ?? []) {
      if (!lang.languageCode) continue;
      const current = best.get(lang.languageCode);
      const confidence = typeof lang.confidence === 'number' ? lang.confidence : null;
      if (current === undefined || (confidence !== null && (current === null || confidence > current))) best.set(lang.languageCode, confidence);
    }
  }
  return [...best.entries()]
    .map(([languageCode, confidence]) => ({ languageCode, confidence }))
    .sort((a, b) => (b.confidence ?? -1) - (a.confidence ?? -1));
}

export function summarizeDocument({ document, includeFull }: { document: DocumentAiDocument | undefined; includeFull: boolean }): ProcessedDocument {
  const doc: DocumentAiDocument = document ?? {};
  const text = typeof doc.text === 'string' ? doc.text : '';
  const pages = Array.isArray(doc.pages) ? doc.pages : [];
  const chars = splitDocumentText(text);
  return {
    text,
    mimeType: typeof doc.mimeType === 'string' ? doc.mimeType : null,
    pageCount: pages.length,
    languages: languagesOf(pages),
    entities: flattenEntities({ entities: doc.entities, chars }),
    formFields: formFieldsOf({ pages, chars }),
    tables: tablesOf({ pages, chars }),
    ...(includeFull ? { document: doc } : {}),
  };
}

function extensionOf(name: string): string | undefined {
  const base = pathOf(name).split('/').pop() ?? '';
  if (!base.includes('.')) return undefined;
  return base.split('.').pop()?.toLowerCase();
}

function pathOf(name: string): string {
  if (/^gs:\/\//i.test(name)) return name.slice('gs://'.length).split('/').slice(1).join('/');
  if (!/^https?:\/\//i.test(name)) return name;
  try {
    return new URL(name).pathname;
  } catch {
    return name;
  }
}

function rowsToText({ rows, chars }: { rows: { cells?: { layout?: Layout }[] }[] | undefined; chars: string[] }): string[][] {
  return (rows ?? []).map((row) => (row.cells ?? []).map((cell) => textOf({ chars, anchor: cell.layout?.textAnchor })));
}

export const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  gif: 'image/gif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  bmp: 'image/bmp',
  webp: 'image/webp',
  html: 'text/html',
  htm: 'text/html',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xlsm: 'application/vnd.ms-excel.sheet.macroenabled.12',
};

export const DEFAULT_FIELD_MASK = 'text,mimeType,entities,pages.pageNumber,pages.formFields,pages.tables,pages.detectedLanguages';

const MAX_SELECTED_PAGES = 30;

export type FlatEntity = {
  type: string;
  mentionText: string;
  confidence: number | null;
  normalizedText: string | null;
  normalizedValue: Record<string, unknown> | null;
  id: string | null;
  page: number | null;
  properties: FlatEntity[];
};

export type FormField = {
  page: number;
  name: string;
  value: string;
  nameConfidence: number | null;
  valueConfidence: number | null;
  valueType: string | null;
};

export type Table = { page: number; headerRows: string[][]; bodyRows: string[][] };

export type DetectedLanguage = { languageCode: string; confidence: number | null };

export type ProcessedDocument = {
  text: string;
  mimeType: string | null;
  pageCount: number;
  languages: DetectedLanguage[];
  entities: FlatEntity[];
  formFields: FormField[];
  tables: Table[];
  document?: DocumentAiDocument;
};
