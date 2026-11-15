import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

export class AirparserApiError extends Error {
	readonly status: number;
	readonly responseBody: unknown;

	constructor({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }) {
		super(`Airparser ${operation} failed (HTTP ${status}): ${vendorMessage(responseBody)}`);
		this.name = 'AirparserApiError';
		this.status = status;
		this.responseBody = responseBody;
	}
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function vendorMessage(responseBody: unknown): string {
	if (typeof responseBody === 'string') {
		const text = responseBody.trim();
		return text === '' ? 'no details returned' : text.slice(0, MAX_ERROR_TEXT);
	}
	if (isRecord(responseBody)) {
		for (const key of ['message', 'error', 'detail', 'errors']) {
			const value = responseBody[key];
			if (typeof value === 'string' && value.trim() !== '') {
				return value.trim().slice(0, MAX_ERROR_TEXT);
			}
		}
		return JSON.stringify(responseBody).slice(0, MAX_ERROR_TEXT);
	}
	if (responseBody === undefined || responseBody === null) {
		return 'no details returned';
	}
	return JSON.stringify(responseBody).slice(0, MAX_ERROR_TEXT);
}

export function pathFor(segments: unknown[]): string {
	return segments.map((segment) => `/${encodeURIComponent(requireId({ value: segment, label: 'ID' }))}`).join('');
}

export function buildUrl({ path, query }: { path: string; query?: AirparserQuery }): string {
	const parts: string[] = [];
	for (const [key, value] of Object.entries(query ?? {})) {
		if (Array.isArray(value)) {
			for (const item of value) {
				if (item !== '') {
					parts.push(`${encodeURIComponent(`${key}[]`)}=${encodeURIComponent(item)}`);
				}
			}
		} else if (value !== undefined && value !== '') {
			parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
		}
	}
	return `${BASE_URL}${path}${parts.length === 0 ? '' : `?${parts.join('&')}`}`;
}

export function verifiedTlsDispatcher(): Promise<unknown> {
	verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
	return verifiedTlsAgent;
}

export function parseBody(text: unknown): unknown {
	if (typeof text !== 'string') {
		return text;
	}
	const trimmed = text.trim();
	if (trimmed === '') {
		return undefined;
	}
	try {
		const parsed: unknown = JSON.parse(trimmed);
		return parsed;
	} catch {
		return trimmed;
	}
}

async function airparserApiCall({
	apiKey,
	method,
	path,
	operation,
	query,
	body,
	timeoutMs = DEFAULT_TIMEOUT_MS,
}: AirparserApiCallParams): Promise<unknown> {
	const key = apiKey.trim();
	if (key === '') {
		throw new Error('The Airparser API key is empty. Reconnect the Airparser connection.');
	}
	const request: HttpRequest = {
		method,
		url: buildUrl({ path, query }),
		headers: { 'X-API-Key': key, Accept: 'application/json' },
		timeout: timeoutMs,
		responseType: 'text',
		redactBodyInErrors: true,
		retries: 0,
	};
	if (body !== undefined) {
		request.body = body;
		if (!(body instanceof FormData)) {
			request.headers = { ...request.headers, 'Content-Type': 'application/json' };
		}
	}
	const dispatcher = await airparserTransport.getDispatcher();
	let response: { status: number; body: unknown };
	try {
		response = await httpClient.sendRequest<string>(request, { dispatcher });
	} catch (error) {
		const failed = failedResponseOf(error);
		if (failed !== undefined) {
			throw new AirparserApiError({ operation, status: failed.status, responseBody: parseBody(failed.body) });
		}
		throw transportError({ error, operation, method, timeoutMs });
	}
	return parseBody(response.body);
}

function failedResponseOf(error: unknown): { status: number; body: unknown } | undefined {
	if (!isRecord(error) && !(error instanceof Error)) {
		return undefined;
	}
	const response: unknown = Reflect.get(error, 'response');
	if (!isRecord(response)) {
		return undefined;
	}
	const status = response['status'];
	if (typeof status !== 'number') {
		return undefined;
	}
	return { status, body: response['body'] };
}

function transportError({
	error,
	operation,
	method,
	timeoutMs,
}: {
	error: unknown;
	operation: string;
	method: HttpMethod;
	timeoutMs: number;
}): Error {
	const aborted = error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
	const reason = aborted
		? `no response within ${Math.round(timeoutMs / 1000)} seconds`
		: `network error: ${error instanceof Error ? error.message : String(error)}`;
	const applied =
		method === HttpMethod.GET ? '' : ' The request may still have been applied in Airparser; check before retrying.';
	return new Error(`Airparser ${operation} failed (${reason}).${applied}`);
}

export function stringOrNull(value: unknown): string | null {
	if (typeof value === 'string') {
		return value;
	}
	if (typeof value === 'number') {
		return String(value);
	}
	return null;
}

export function numberOrNull(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function toDocument(raw: unknown): AirparserDocumentOutput {
	const doc = isRecord(raw) ? raw : {};
	return {
		id: stringOrNull(doc['_id']),
		inbox_id: stringOrNull(doc['inbox_id']),
		name: stringOrNull(doc['name']),
		filename: stringOrNull(doc['filename']),
		content_type: stringOrNull(doc['content_type']),
		status: stringOrNull(doc['status']),
		format: stringOrNull(doc['format']),
		created_at: stringOrNull(doc['created_at']),
		processed_at: stringOrNull(doc['processed_at']),
		credits: numberOrNull(doc['credits']),
		data_text: stringOrNull(doc['data_text']),
		json: isRecord(doc['json']) ? doc['json'] : null,
	};
}

export function toSyncResult(raw: unknown): AirparserSyncOutput {
	const doc = isRecord(raw) ? raw : {};
	return {
		doc_id: stringOrNull(doc['doc_id']) ?? stringOrNull(doc['_id']),
		parsing_in_progress: doc['parsing_in_progress'] === true,
		status: stringOrNull(doc['status']),
		name: stringOrNull(doc['name']),
		content_type: stringOrNull(doc['content_type']),
		created_at: stringOrNull(doc['created_at']),
		processed_at: stringOrNull(doc['processed_at']),
		json: isRecord(doc['json']) ? doc['json'] : null,
	};
}

export function toInbox({ raw, fallbackId }: { raw: unknown; fallbackId?: string }): AirparserInboxOutput {
	const inbox = isRecord(raw) ? raw : {};
	const schema = isRecord(inbox['schema']) ? inbox['schema'] : {};
	return {
		id: stringOrNull(inbox['_id']) ?? stringOrNull(inbox['inbox_id']) ?? stringOrNull(inbox['id']) ?? (typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : fallbackId ?? null),
		name: stringOrNull(inbox['name']),
		email_prefix: stringOrNull(inbox['email_prefix']),
		llm_engine: stringOrNull(inbox['llm_engine']) ?? stringOrNull(inbox['gpt_engine']),
		model: stringOrNull(inbox['gpt_model']),
		is_active: typeof inbox['is_active'] === 'boolean' ? inbox['is_active'] : null,
		retention: inbox['retention'] === undefined ? null : inbox['retention'],
		schema: {
			fields: Array.isArray(schema['fields']) ? schema['fields'] : Array.isArray(inbox['schema']) ? inbox['schema'] : [],
			updated_at: stringOrNull(schema['updated_at']),
		},
	};
}

export function docIdOf(raw: unknown): string {
	if (typeof raw === 'string') {
		const id = raw.trim().replace(/^"|"$/g, '');
		if (id !== '') {
			return id;
		}
	}
	if (isRecord(raw)) {
		for (const key of ['doc_id', 'docId', '_id', 'id']) {
			const id = stringOrNull(raw[key]);
			if (id !== null && id !== '') {
				return id;
			}
		}
	}
	throw new Error(`Airparser upload returned no document ID: ${vendorMessage(raw)}`);
}

export function buildUploadForm({ file, fileName, meta }: UploadFormParams): FormData {
	const data = fileBytesOf(file);
	const name = withExtension({ name: (fileName ?? '').trim() || (typeof file.filename === 'string' && file.filename !== '' ? file.filename : 'document'), file });
	const form = new FormData();
	form.append('file', new Blob([new Uint8Array(data)]), name);
	if (meta !== undefined && meta !== null && Object.keys(meta).length > 0) {
		form.append('meta', JSON.stringify(meta));
	}
	return form;
}

function withExtension({ name, file }: { name: string; file: UploadFile }): string {
	if (/\.[A-Za-z0-9]+$/.test(name)) {
		return name;
	}
	const fromFilename = typeof file.filename === 'string' ? /\.([A-Za-z0-9]+)$/.exec(file.filename)?.[1] : undefined;
	const extension = (typeof file.extension === 'string' && file.extension.trim() !== '' ? file.extension.trim().replace(/^\./, '') : undefined) ?? fromFilename;
	return extension === undefined ? name : `${name}.${extension}`;
}

function fileBytesOf(file: UploadFile): Buffer {
	if (Buffer.isBuffer(file.data)) {
		return file.data;
	}
	if (typeof file.base64 === 'string' && file.base64 !== '') {
		return Buffer.from(file.base64, 'base64');
	}
	throw new Error('The file could not be read. Map a file from a previous step or upload one.');
}

export function parseJsonObjectInput({ value, label }: { value: unknown; label: string }): Record<string, unknown> | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	if (isRecord(value)) {
		return value;
	}
	if (typeof value === 'string') {
		try {
			const parsed: unknown = JSON.parse(value);
			if (isRecord(parsed)) {
				return parsed;
			}
		} catch {
			throw new Error(`${label} must be a JSON object, for example {"external_id": 42}.`);
		}
	}
	throw new Error(`${label} must be a JSON object, for example {"external_id": 42}.`);
}

export function requireId({ value, label }: { value: unknown; label: string }): string {
	const id = typeof value === 'string' ? value.trim() : '';
	if (id === '') {
		throw new Error(`${label} is required.`);
	}
	return id;
}

const documentFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Document ID' },
	{ key: 'inbox_id', label: 'Inbox ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'filename', label: 'File Name' },
	{ key: 'content_type', label: 'Content Type' },
	{ key: 'status', label: 'Status', description: 'For example importing, parsing, parsed or fail.' },
	{ key: 'format', label: 'Format' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'processed_at', label: 'Processed At', format: 'datetime' },
	{ key: 'credits', label: 'Credits Used', format: 'number' },
	{ key: 'data_text', label: 'Document Text' },
	{ key: 'json', label: 'Extracted Data', description: 'Fields from the inbox extraction schema; __meta__ holds the upload metadata.' },
];

const syncFields: OutputSchemaField[] = [
	{ key: 'doc_id', label: 'Document ID' },
	{ key: 'parsing_in_progress', label: 'Still Parsing', format: 'boolean', description: 'True when parsing took longer than about 60 seconds; fetch the document later.' },
	{ key: 'status', label: 'Status' },
	{ key: 'name', label: 'Name' },
	{ key: 'content_type', label: 'Content Type' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'processed_at', label: 'Processed At', format: 'datetime' },
	{ key: 'json', label: 'Extracted Data' },
];

const inboxFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Inbox ID' },
	{ key: 'name', label: 'Name' },
];

const inboxDetailFields: OutputSchemaField[] = [
	{ key: 'email_prefix', label: 'Email Prefix', description: 'Prefix of the inbox email address used to forward documents.' },
	{ key: 'llm_engine', label: 'Engine', description: 'text or vision.' },
	{ key: 'model', label: 'Model' },
	{ key: 'is_active', label: 'Active', format: 'boolean' },
	{ key: 'retention', label: 'Retention' },
	{
		key: 'schema',
		label: 'Extraction Schema',
		children: [
			{ key: 'fields', label: 'Fields' },
			{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
		],
	},
];

const MAX_ERROR_TEXT = 500;
const DEFAULT_TIMEOUT_MS = 30_000;
let verifiedTlsAgent: Promise<unknown> | undefined;

export const BASE_URL = 'https://api.airparser.com';
export const UPLOAD_TIMEOUT_MS = 120_000;
export const SYNC_UPLOAD_TIMEOUT_MS = 150_000;
export const DOCS_PAGE_SIZE_MAX = 100;

export const airparserTransport = {
	getDispatcher: verifiedTlsDispatcher,
};

export const airparserClient = {
	call: airparserApiCall,
};

export const airparserOutputSchemas = {
	upload: { fields: [{ key: 'docId', label: 'Document ID' }] } satisfies OutputSchema,
	document: { fields: documentFields } satisfies OutputSchema,
	sync: { fields: syncFields } satisfies OutputSchema,
	listInboxes: {
		fields: [{ key: 'inboxes', label: 'Inboxes', labelKey: 'name', listItems: inboxFields }],
	} satisfies OutputSchema,
	inbox: {
		fields: [
			...inboxFields,
			...inboxDetailFields,
		],
	} satisfies OutputSchema,
	listDocuments: {
		fields: [
			{
				key: 'docs',
				label: 'Documents',
				labelKey: 'name',
				listItems: [
					{ key: 'id', label: 'Document ID' },
					{ key: 'name', label: 'Name' },
					{ key: 'status', label: 'Status' },
					{ key: 'created_at', label: 'Created At', format: 'datetime' },
					{ key: 'processed_at', label: 'Processed At', format: 'datetime' },
				],
			},
			{ key: 'page', label: 'Page', format: 'number' },
			{ key: 'per_page', label: 'Per Page', format: 'number' },
			{ key: 'hasNextPage', label: 'Has Next Page', format: 'boolean' },
		],
	} satisfies OutputSchema,
	createInbox: { fields: [...inboxFields, ...inboxDetailFields] } satisfies OutputSchema,
	upsertSchema: {
		fields: [
			{ key: 'success', label: 'Success', format: 'boolean' },
			{ key: 'inbox_id', label: 'Inbox ID' },
			{ key: 'field_count', label: 'Field Count', format: 'number' },
		],
	} satisfies OutputSchema,
};

export type AirparserQuery = Record<string, string | number | string[] | undefined>;

export type AirparserApiCallParams = {
	apiKey: string;
	method: HttpMethod;
	path: string;
	operation: string;
	query?: AirparserQuery;
	body?: FormData | Record<string, unknown>;
	timeoutMs?: number;
};

export type UploadFile = {
	filename?: unknown;
	extension?: unknown;
	base64?: unknown;
	data?: unknown;
};

export type UploadFormParams = {
	file: UploadFile;
	fileName?: string | null;
	meta?: Record<string, unknown> | null;
};

export type AirparserDocumentOutput = {
	id: string | null;
	inbox_id: string | null;
	name: string | null;
	filename: string | null;
	content_type: string | null;
	status: string | null;
	format: string | null;
	created_at: string | null;
	processed_at: string | null;
	credits: number | null;
	data_text: string | null;
	json: Record<string, unknown> | null;
};

export type AirparserInboxOutput = {
	id: string | null;
	name: string | null;
	email_prefix: string | null;
	llm_engine: string | null;
	model: string | null;
	is_active: boolean | null;
	retention: unknown;
	schema: { fields: unknown[]; updated_at: string | null };
};

export type AirparserSyncOutput = {
	doc_id: string | null;
	parsing_in_progress: boolean;
	status: string | null;
	name: string | null;
	content_type: string | null;
	created_at: string | null;
	processed_at: string | null;
	json: Record<string, unknown> | null;
};
