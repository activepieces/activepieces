import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';
import { SoftrRecord, SoftrSingleResponse, SoftrTable, TableField } from './types';

const BASE_URL = 'https://tables-api.softr.io/api/v1';
const STUDIO_USERS_URL = 'https://studio-api.softr.io/v1/api/users';
const MAX_ERROR_TEXT_LENGTH = 500;
const STUDIO_TIMEOUT_MS = 60_000;

class SoftrApiError extends Error {
	readonly status: number;
	readonly responseBody: unknown;

	constructor({ status, responseBody, message }: { status: number; responseBody: unknown; message: string }) {
		super(message);
		this.name = 'SoftrApiError';
		this.status = status;
		this.responseBody = responseBody;
	}
}

async function request<T>({ apiKey, method, path, body, queryParams }: RequestParams): Promise<T> {
	try {
		const response = await httpClient.sendRequest<T>({
			method,
			url: `${BASE_URL}${path}`,
			headers: {
				'Softr-Api-Key': apiKey,
				'Content-Type': 'application/json',
			},
			queryParams,
			body,
		});
		return response.body;
	} catch (error) {
		throw toSoftrError(error);
	}
}

// App user requests carry emails and passwords. The shared httpClient logs the full
// request body on any error response before throwing (see FetchHttpClient), and the
// engine does not redact that line, so these calls use fetch directly.
async function studioRequest({ apiKey, domain, method, path, body }: StudioRequestParams): Promise<{ status: number; body: unknown }> {
	const response = await fetch(`${STUDIO_USERS_URL}${path}`, {
		method,
		headers: {
			'Softr-Api-Key': apiKey,
			'Softr-Domain': normalizeDomain(domain),
			'Content-Type': 'application/json',
			Accept: 'application/json, text/plain',
		},
		body: body === undefined ? undefined : JSON.stringify(body),
		redirect: 'manual',
		signal: AbortSignal.timeout(STUDIO_TIMEOUT_MS),
	});
	const responseBody = await readBody(response);
	if (response.status < 200 || response.status >= 300) {
		throw new SoftrApiError({ status: response.status, responseBody, message: describeFailure({ status: response.status, responseBody }) });
	}
	return { status: response.status, body: responseBody };
}

async function readBody(response: Response): Promise<unknown> {
	const text = await response.text();
	if (text.length === 0) {
		return undefined;
	}
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

async function getTable({ apiKey, databaseId, tableId }: { apiKey: string; databaseId: string; tableId: string }): Promise<SoftrTable> {
	const response = await request<SoftrSingleResponse<SoftrTable>>({
		apiKey,
		method: HttpMethod.GET,
		path: tablePath({ databaseId, tableId }),
	});
	return response.data;
}

function databasePath({ databaseId }: { databaseId: string }): string {
	return `/databases/${encodeURIComponent(databaseId)}`;
}

function tablePath({ databaseId, tableId }: { databaseId: string; tableId: string }): string {
	return `${databasePath({ databaseId })}/tables/${encodeURIComponent(tableId)}`;
}

function fieldPath({ databaseId, tableId, fieldId }: { databaseId: string; tableId: string; fieldId: string }): string {
	return `${tablePath({ databaseId, tableId })}/fields/${encodeURIComponent(fieldId)}`;
}

function recordsPath({ databaseId, tableId }: { databaseId: string; tableId: string }): string {
	return `${tablePath({ databaseId, tableId })}/records`;
}

function recordPath({ databaseId, tableId, recordId }: { databaseId: string; tableId: string; recordId: string }): string {
	return `${recordsPath({ databaseId, tableId })}/${encodeURIComponent(recordId)}`;
}

function withFieldNames({ record, tableFields }: { record: SoftrRecord; tableFields: TableField[] }): SoftrRecord {
	const namesById = new Map(tableFields.map((field) => [field.id, field.name]));
	const fields = Object.fromEntries(
		Object.entries(record.fields ?? {}).map(([key, value]) => [namesById.get(key) ?? key, value]),
	);
	return { ...record, fields };
}

function getErrorStatus(error: unknown): number | null {
	return error instanceof SoftrApiError ? error.status : null;
}

function normalizeDomain(domain: string): string {
	const normalized = domain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
	if (normalized.length === 0 || /[\s/?#@]/.test(normalized)) {
		throw new Error('Enter the Softr app domain only, for example "myapp.softr.app" or "portal.example.com".');
	}
	return normalized;
}

function toSoftrError(error: unknown): unknown {
	const failure = readHttpFailure(error);
	if (failure === null) {
		return error;
	}
	return new SoftrApiError({
		status: failure.status,
		responseBody: failure.responseBody,
		message: describeFailure(failure),
	});
}

function readHttpFailure(error: unknown): { status: number; responseBody: unknown } | null {
	if (typeof error !== 'object' || error === null || !('response' in error)) {
		return null;
	}
	const response = error.response;
	if (typeof response !== 'object' || response === null || !('status' in response) || typeof response.status !== 'number') {
		return null;
	}
	return { status: response.status, responseBody: 'body' in response ? response.body : undefined };
}

function describeFailure({ status, responseBody }: { status: number; responseBody: unknown }): string {
	const vendor = readVendorError(responseBody);
	const code = vendor.errorCode ? ` ${vendor.errorCode}` : '';
	const text = vendor.message ?? STATUS_HINTS[status] ?? 'Request failed.';
	const details = vendor.details ? ` Details: ${vendor.details}` : '';
	const hint = vendor.message && STATUS_HINTS[status] ? ` ${STATUS_HINTS[status]}` : '';
	return `Softr API error (${status}${code}): ${withPeriod(text)}${details}${hint}`;
}

function readVendorError(responseBody: unknown): { message?: string; errorCode?: string; details?: string } {
	if (typeof responseBody === 'string') {
		const trimmed = responseBody.trim();
		return trimmed.length > 0 ? { message: truncate(trimmed) } : {};
	}
	if (typeof responseBody !== 'object' || responseBody === null) {
		return {};
	}
	const message = 'message' in responseBody && typeof responseBody.message === 'string' ? responseBody.message : undefined;
	const errorCode =
		'errorCode' in responseBody && typeof responseBody.errorCode === 'string'
			? responseBody.errorCode
			: 'code' in responseBody && typeof responseBody.code === 'string'
				? responseBody.code
				: undefined;
	const details =
		'details' in responseBody && typeof responseBody.details === 'object' && responseBody.details !== null
			? truncate(JSON.stringify(responseBody.details))
			: undefined;
	return { message, errorCode, details };
}

function withPeriod(value: string): string {
	return /[.!?]$/.test(value) ? value : `${value}.`;
}

function truncate(value: string): string {
	return value.length > MAX_ERROR_TEXT_LENGTH ? `${value.slice(0, MAX_ERROR_TEXT_LENGTH)}...` : value;
}

const STATUS_HINTS: Record<number, string> = {
	401: 'Check that the API key on the connection is valid and, for app user actions, that the Softr domain is correct.',
	403: 'The API key does not have access to this resource.',
	404: 'The requested resource was not found. Check the IDs or email you entered.',
	429: 'Softr rate limit reached. Try again shortly.',
};

type RequestParams = {
	apiKey: string;
	method: HttpMethod;
	path: string;
	body?: unknown;
	queryParams?: QueryParams;
};

type StudioRequestParams = {
	apiKey: string;
	domain: string;
	method: HttpMethod;
	path: string;
	body?: unknown;
};

export const softrClient = {
	baseUrl: BASE_URL,
	request,
	studioRequest,
	getTable,
	databasePath,
	tablePath,
	fieldPath,
	recordsPath,
	recordPath,
	withFieldNames,
	getErrorStatus,
};
