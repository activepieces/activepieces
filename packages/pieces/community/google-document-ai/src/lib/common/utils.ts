import type {
	GoogleDocumentAiDetectedLanguage,
	GoogleDocumentAiDocument,
	GoogleDocumentAiEntity,
	GoogleDocumentAiFlatEntity,
	GoogleDocumentAiFormField,
	GoogleDocumentAiPage,
	GoogleDocumentAiProcessedDocument,
	GoogleDocumentAiResolvedAuth,
	GoogleDocumentAiTable,
	GoogleDocumentAiTableRow,
	GoogleDocumentAiTextAnchor,
} from './types';

function parentOf({
	auth,
}: {
	auth: Pick<GoogleDocumentAiResolvedAuth, 'projectId' | 'location'>;
}): string {
	return `projects/${auth.projectId}/locations/${auth.location}`;
}

function processorResourceName({
	auth,
	processor,
	version,
}: {
	auth: Pick<GoogleDocumentAiResolvedAuth, 'projectId' | 'location'>;
	processor: string;
	version?: string;
}): string {
	const trimmed = String(processor ?? '').trim();
	if (trimmed === '') {
		throw new Error('Pick a processor.');
	}
	let name: string;
	if (trimmed.startsWith('projects/')) {
		if (
			!/^projects\/[^/]+\/locations\/[^/]+\/processors\/[^/]+(\/processorVersions\/[^/]+)?$/.test(
				trimmed,
			)
		) {
			throw new Error(
				`"${trimmed}" is not a processor resource name (expected projects/<project>/locations/<location>/processors/<id>).`,
			);
		}
		name = trimmed;
	} else if (/^[a-z0-9]+$/i.test(trimmed)) {
		name = `${parentOf({ auth })}/processors/${trimmed}`;
	} else {
		throw new Error(`"${trimmed}" is not a processor id or resource name.`);
	}
	const v = String(version ?? '').trim();
	if (v === '') return name;
	if (name.includes('/processorVersions/')) {
		throw new Error(
			'The processor name already carries a version; leave Processor Version empty or pass the bare processor.',
		);
	}
	return v.startsWith('projects/')
		? v
		: `${name}/processorVersions/${v.replace(/^processorVersions\//, '')}`;
}

function mimeTypeFor({
	explicit,
	names,
}: {
	explicit: string | undefined;
	names: (string | undefined)[];
}): string {
	const given = String(explicit ?? '').trim();
	if (given !== '') return given;
	for (const name of names) {
		const ext = extensionOf(String(name ?? '').trim());
		if (ext && MIME_BY_EXTENSION[ext]) return MIME_BY_EXTENSION[ext];
	}
	throw new Error(
		`Could not tell the file type from the name; fill in MIME Type (one of ${supportedMimeTypes()}).`,
	);
}

function supportedMimeTypes(): string {
	return [...new Set(Object.values(MIME_BY_EXTENSION))].join(', ');
}

function parsePageSelection(value: string | undefined): number[] | undefined {
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
		const [from, to] = range
			? [Number(range[1]), Number(range[2])]
			: [Number(piece), Number(piece)];
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
					`Too many pages selected: pick at most ${MAX_SELECTED_PAGES} (online processing takes up to 15 pages, 30 with Imageless Mode). For longer documents use Custom API Call with batchProcess.`,
				);
			}
		}
	}
	return [...pages].sort((a, b) => a - b);
}

function textOf({
	chars,
	anchor,
}: {
	chars: string[];
	anchor: GoogleDocumentAiTextAnchor | undefined;
}): string {
	if (!anchor) return '';
	if (anchor.content) return anchor.content.trim();
	const segments = anchor.textSegments ?? [];
	if (segments.length === 0 || chars.length === 0) return '';
	return segments
		.map((s) => chars.slice(Number(s.startIndex ?? 0), Number(s.endIndex ?? chars.length)).join(''))
		.join('')
		.trim();
}

function splitDocumentText(text: string | undefined): string[] {
	return Array.from(text ?? '');
}

function flattenEntities({
	entities,
	chars,
}: {
	entities: GoogleDocumentAiEntity[] | undefined;
	chars: string[];
}): GoogleDocumentAiFlatEntity[] {
	if (!Array.isArray(entities)) return [];
	return entities.map((e) => {
		const { text: normalizedText, ...rest } = e.normalizedValue ?? {};
		const pageRef = e.pageAnchor?.pageRefs?.[0];
		return {
			type: e.type ?? '',
			mentionText: e.mentionText ?? textOf({ chars, anchor: e.textAnchor }),
			confidence: typeof e.confidence === 'number' ? e.confidence : null,
			normalizedText: typeof normalizedText === 'string' ? normalizedText : null,
			normalizedValue: e.normalizedValue
				? { ...rest, ...(normalizedText !== undefined ? { text: normalizedText } : {}) }
				: null,
			id: e.id ?? null,
			page: pageRef === undefined ? null : Number(pageRef.page ?? 0) + 1,
			properties: flattenEntities({ entities: e.properties, chars }),
		};
	});
}

function formFieldsOf({
	pages,
	chars,
	selectedPages,
}: {
	pages: GoogleDocumentAiPage[] | undefined;
	chars: string[];
	selectedPages?: number[];
}): GoogleDocumentAiFormField[] {
	if (!Array.isArray(pages)) return [];
	return pages.flatMap((page, index) =>
		(page.formFields ?? []).map((f) => ({
			page: pageLabel({ page, index, selectedPages }),
			name: textOf({ chars, anchor: f.fieldName?.textAnchor }),
			value: textOf({ chars, anchor: f.fieldValue?.textAnchor }),
			nameConfidence: typeof f.fieldName?.confidence === 'number' ? f.fieldName.confidence : null,
			valueConfidence:
				typeof f.fieldValue?.confidence === 'number' ? f.fieldValue.confidence : null,
			valueType: f.valueType ?? null,
		})),
	);
}

function tablesOf({
	pages,
	chars,
	selectedPages,
}: {
	pages: GoogleDocumentAiPage[] | undefined;
	chars: string[];
	selectedPages?: number[];
}): GoogleDocumentAiTable[] {
	if (!Array.isArray(pages)) return [];
	return pages.flatMap((page, index) =>
		(page.tables ?? []).map((t) => ({
			page: pageLabel({ page, index, selectedPages }),
			headerRows: rowsToText({ rows: t.headerRows, chars }),
			bodyRows: rowsToText({ rows: t.bodyRows, chars }),
		})),
	);
}

function languagesOf(
	pages: GoogleDocumentAiPage[] | undefined,
): GoogleDocumentAiDetectedLanguage[] {
	if (!Array.isArray(pages)) return [];
	const best = new Map<string, number | null>();
	for (const page of pages) {
		for (const lang of page.detectedLanguages ?? []) {
			if (!lang.languageCode) continue;
			const current = best.get(lang.languageCode);
			const confidence = typeof lang.confidence === 'number' ? lang.confidence : null;
			if (
				current === undefined ||
				(confidence !== null && (current === null || confidence > current))
			)
				best.set(lang.languageCode, confidence);
		}
	}
	return [...best.entries()]
		.map(([languageCode, confidence]) => ({ languageCode, confidence }))
		.sort((a, b) => (b.confidence ?? -1) - (a.confidence ?? -1));
}

function summarizeDocument({
	document,
	includeFull,
	selectedPages,
}: {
	document: GoogleDocumentAiDocument | undefined;
	includeFull: boolean;
	selectedPages?: number[];
}): GoogleDocumentAiProcessedDocument {
	const doc: GoogleDocumentAiDocument = document ?? {};
	const text = typeof doc.text === 'string' ? doc.text : '';
	const pages = Array.isArray(doc.pages) ? doc.pages : [];
	const chars = splitDocumentText(text);
	return {
		text,
		mimeType: typeof doc.mimeType === 'string' ? doc.mimeType : null,
		pageCount: pages.length,
		languages: languagesOf(pages),
		entities: flattenEntities({ entities: doc.entities, chars }),
		formFields: formFieldsOf({ pages, chars, selectedPages }),
		tables: tablesOf({ pages, chars, selectedPages }),
		...(includeFull ? { document: doc } : {}),
	};
}

function effectiveFieldMask({ fieldMask }: { fieldMask: string | undefined }): string {
	const paths = [
		...new Set(
			String(fieldMask ?? '')
				.split(',')
				.map((p) => p.trim())
				.filter((p) => p !== ''),
		),
	];
	if (paths.length === 0) return DEFAULT_FIELD_MASK;
	if (
		!paths.includes('pages') &&
		!paths.includes('pages.pageNumber') &&
		paths.some(needsPageNumber)
	)
		paths.push('pages.pageNumber');
	if (!paths.includes('text') && paths.some(needsDocumentText)) paths.push('text');
	return paths.join(',');
}

function needsPageNumber(path: string): boolean {
	const [root, field] = path.split('.');
	return root === 'pages' && field !== undefined && PAGE_LABELLED_SEGMENTS.includes(field);
}

function pageLabel({
	page,
	index,
	selectedPages,
}: {
	page: GoogleDocumentAiPage;
	index: number;
	selectedPages: number[] | undefined;
}): number {
	if (typeof page.pageNumber === 'number') return page.pageNumber;
	return selectedPages?.[index] ?? index + 1;
}

function needsDocumentText(path: string): boolean {
	if (path === 'entities' || path.startsWith('entities.') || path === 'pages') return true;
	if (!path.startsWith('pages.')) return false;
	return path
		.split('.')
		.slice(1)
		.some((segment) => TEXT_ANCHORED_PAGE_SEGMENTS.includes(segment));
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

function rowsToText({
	rows,
	chars,
}: {
	rows: GoogleDocumentAiTableRow[] | undefined;
	chars: string[];
}): string[][] {
	return (rows ?? []).map((row) =>
		(row.cells ?? []).map((cell) => textOf({ chars, anchor: cell.layout?.textAnchor })),
	);
}

const MIME_BY_EXTENSION: Record<string, string> = {
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

const DEFAULT_FIELD_MASK =
	'text,mimeType,entities,pages.pageNumber,pages.formFields,pages.tables,pages.detectedLanguages';

export const googleDocumentAiUtils = {
	parentOf,
	processorResourceName,
	mimeTypeFor,
	parsePageSelection,
	textOf,
	splitDocumentText,
	flattenEntities,
	formFieldsOf,
	tablesOf,
	languagesOf,
	summarizeDocument,
	effectiveFieldMask,
	DEFAULT_FIELD_MASK,
};

const MAX_SELECTED_PAGES = 30;

const PAGE_LABELLED_SEGMENTS = [
	'formFields',
	'tables',
	'paragraphs',
	'lines',
	'tokens',
	'blocks',
	'layout',
];

const TEXT_ANCHORED_PAGE_SEGMENTS = [
	'formFields',
	'tables',
	'paragraphs',
	'lines',
	'tokens',
	'blocks',
	'layout',
	'textAnchor',
];
