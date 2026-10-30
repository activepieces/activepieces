import {
	getAccessTokenOrThrow,
	httpClient,
	HttpMethod,
	HttpRequest,
} from '@activepieces/pieces-common';
import { AppConnectionType, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import type { FetchFunction, Fetcher } from 'intercom-client/core';
import type { intercomAuth } from '../auth';

const REGION_BASE_URLS: Record<string, string> = {
	intercom: 'https://api.intercom.io',
	'eu.intercom': 'https://api.eu.intercom.io',
	'au.intercom': 'https://api.au.intercom.io',
};

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const MAX_ERROR_TEXT = 500;

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getIntercomBaseUrl(region: unknown): string {
	if (region === undefined || region === null || region === '') {
		return REGION_BASE_URLS['intercom'];
	}
	if (typeof region === 'string' && Object.prototype.hasOwnProperty.call(REGION_BASE_URLS, region)) {
		return REGION_BASE_URLS[region];
	}
	throw new Error('Unsupported Intercom region. Reconnect Intercom and pick US, EU or AU.');
}

export function getIntercomToken(auth: IntercomAuthValue): string {
	if (auth.type === AppConnectionType.CUSTOM_AUTH) {
		return auth.props.accessToken;
	}
	return getAccessTokenOrThrow(auth);
}

export function getIntercomRegion(auth: IntercomAuthValue): string {
	if (auth.type === AppConnectionType.CUSTOM_AUTH) {
		return auth.props.region;
	}
	const region = auth.props?.['region'];
	return typeof region === 'string' ? region : 'intercom';
}

let verifiedTlsAgent: Promise<unknown> | undefined;

export function verifiedTlsDispatcher(): Promise<unknown> {
	verifiedTlsAgent ??= import('undici').then(
		({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }),
	);
	return verifiedTlsAgent;
}

export class IntercomApiError extends Error {
	readonly status: number;
	readonly code: string | undefined;
	readonly responseBody: unknown;

	constructor({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }) {
		super(`Intercom ${operation} failed (${status}): ${describeError({ status, responseBody })}`);
		this.name = 'IntercomApiError';
		this.status = status;
		this.code = errorCode(responseBody);
		this.responseBody = responseBody;
	}
}

export function isIntercomNotFound({ error, codes }: { error: unknown; codes: string[] }): boolean {
	return (
		error instanceof IntercomApiError &&
		error.status === 404 &&
		(error.code === undefined || codes.includes(error.code))
	);
}

export async function intercomRequest<T>({
	auth,
	method,
	path,
	query,
	body,
	operation,
}: {
	auth: IntercomAuthValue;
	method: HttpMethod;
	path: string[];
	query?: Record<string, string | number | boolean | undefined>;
	body?: unknown;
	operation: string;
}): Promise<T> {
	const url = `${getIntercomBaseUrl(getIntercomRegion(auth))}/${encodePath(path)}`;
	const response = await sendIntercomHttp<T>({
		method,
		url,
		headers: {
			Authorization: `Bearer ${getIntercomToken(auth)}`,
			'Intercom-Version': INTERCOM_API_VERSION,
			Accept: 'application/json',
			...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
		},
		queryParams: toQueryParams(query),
		body,
	});
	if (!response.ok) {
		throw new IntercomApiError({ operation, status: response.status, responseBody: response.body });
	}
	return response.body;
}

export async function getCurrentAdmin(auth: IntercomAuthValue): Promise<IntercomMe> {
	return intercomRequest<IntercomMe>({
		auth,
		method: HttpMethod.GET,
		path: ['me'],
		operation: 'get the current admin',
	});
}

export async function resolveAdminId({
	auth,
	adminId,
}: {
	auth: IntercomAuthValue;
	adminId: string | undefined;
}): Promise<string> {
	const trimmed = adminId?.trim();
	if (trimmed) {
		return trimmed;
	}
	const me = await getCurrentAdmin(auth);
	return String(me.id);
}

export function encodePath(segments: string[]): string {
	return segments
		.map((segment) => {
			const value = typeof segment === 'string' ? segment.trim() : '';
			if (value === '' || value === '.' || value === '..') {
				throw new Error('An Intercom ID is empty or invalid. Pass the ID exactly as Intercom returns it.');
			}
			return encodeURIComponent(value);
		})
		.join('/');
}

export async function collectCapped<T>({
	max,
	fetchPage,
}: {
	max: number;
	fetchPage: (cursor: string | undefined) => Promise<{ items: T[]; next: string | undefined }>;
}): Promise<{ items: T[]; truncated: boolean }> {
	let collected: T[] = [];
	let cursor: string | undefined = undefined;
	for (;;) {
		const page = await fetchPage(cursor);
		collected = collected.concat(page.items);
		if (collected.length >= max) {
			return { items: collected.slice(0, max), truncated: collected.length > max || page.next !== undefined };
		}
		if (page.next === undefined || page.items.length === 0) {
			return { items: collected, truncated: false };
		}
		cursor = page.next;
	}
}

export function nextStartingAfter(body: unknown): string | undefined {
	if (typeof body !== 'object' || body === null) {
		return undefined;
	}
	const pages = isRecord(body) ? body['pages'] : undefined;
	const next = isRecord(pages) ? pages['next'] : undefined;
	if (isRecord(next)) {
		const cursor = next['starting_after'];
		return typeof cursor === 'string' && cursor.length > 0 ? cursor : undefined;
	}
	return undefined;
}

export function nextPageNumber(body: unknown): number | undefined {
	if (typeof body !== 'object' || body === null) {
		return undefined;
	}
	const pages = isRecord(body) ? body['pages'] : undefined;
	const page = Number(isRecord(pages) ? pages['page'] : undefined);
	const totalPages = Number(isRecord(pages) ? pages['total_pages'] : undefined);
	if (!Number.isFinite(page) || !Number.isFinite(totalPages)) {
		return undefined;
	}
	return page < totalPages ? page + 1 : undefined;
}

async function sendIntercomHttp<T = unknown>({
	method,
	url,
	headers,
	queryParams,
	body,
	timeout,
}: {
	method: HttpMethod;
	url: string;
	headers: Record<string, string>;
	queryParams?: Record<string, string>;
	body?: unknown;
	timeout?: number;
}): Promise<IntercomHttpResult<T>> {
	const dispatcher = await verifiedTlsDispatcher();
	const request: HttpRequest = {
		method,
		url,
		headers,
		queryParams,
		body,
		timeout: timeout ?? REQUEST_TIMEOUT_MS,
		followRedirects: false,
	};
	for (let attempt = 0; ; attempt++) {
		const canRetry = attempt < MAX_RETRIES;
		let result: IntercomHttpResult<T>;
		try {
			result = await sendOnce<T>({ request, dispatcher });
		} catch (error) {
			if (method !== HttpMethod.GET || !canRetry || !isNetworkError(error)) {
				throw error;
			}
			await intercomHttpInternals.sleep(1000);
			continue;
		}
		if (!result.ok && canRetry && shouldRetry({ method, status: result.status })) {
			await intercomHttpInternals.sleep(Math.min(2000 * 2 ** attempt, 10_000));
			continue;
		}
		return result;
	}
}

function isNetworkError(error: unknown): boolean {
	return error instanceof TypeError && error.message === 'fetch failed';
}

async function sendOnce<T>({
	request,
	dispatcher,
}: {
	request: HttpRequest;
	dispatcher: unknown;
}): Promise<IntercomHttpResult<T>> {
	try {
		const response = await httpClient.sendRequest<T>(request, { dispatcher });
		if (response.status >= 300) {
			return { ok: false, status: response.status, body: 'Intercom answered with an unexpected redirect.' };
		}
		return { ok: true, status: response.status, body: response.body, headers: response.headers ?? {} };
	} catch (error) {
		const status = statusOf(error);
		if (status === undefined) {
			throw error;
		}
		return { ok: false, status, body: responseBodyOf(error) };
	}
}

function toHttpMethod(method: string): HttpMethod {
	const upper = method.toUpperCase();
	const match = Object.values(HttpMethod).find((value) => value === upper);
	if (match === undefined) {
		throw new Error(`Unsupported HTTP method ${method}`);
	}
	return match;
}

function shouldRetry({ method, status }: { method: HttpMethod; status: number }): boolean {
	if (status === 429) {
		return true;
	}
	return method === HttpMethod.GET && (status === 502 || status === 503 || status === 504);
}

function statusOf(error: unknown): number | undefined {
	if (typeof error !== 'object' || error === null) {
		return undefined;
	}
	const response = Reflect.get(error, 'response');
	const status = isRecord(response) ? response['status'] : undefined;
	return typeof status === 'number' ? status : undefined;
}

function responseBodyOf(error: unknown): unknown {
	const response = isRecord(error) ? error['response'] : undefined;
	return isRecord(response) ? response['body'] : undefined;
}

function toQueryParams(
	query: Record<string, string | number | boolean | undefined> | undefined,
): Record<string, string> | undefined {
	if (!query) {
		return undefined;
	}
	const entries = Object.entries(query).filter(
		(entry): entry is [string, string | number | boolean] => entry[1] !== undefined && entry[1] !== '',
	);
	return entries.length === 0 ? undefined : Object.fromEntries(entries.map(([key, value]) => [key, String(value)]));
}

function sdkQueryParams(query: Fetcher.Args['queryParameters']): Record<string, string> | undefined {
	if (!query) {
		return undefined;
	}
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(query)) {
		if (value === null || value === undefined) {
			continue;
		}
		result[key] = Array.isArray(value)
			? value.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(',')
			: typeof value === 'object'
			? JSON.stringify(value)
			: String(value);
	}
	return Object.keys(result).length === 0 ? undefined : result;
}

function errorCode(responseBody: unknown): string | undefined {
	const first = firstError(responseBody);
	return typeof first?.['code'] === 'string' ? first['code'] : undefined;
}

function firstError(responseBody: unknown): Record<string, unknown> | undefined {
	if (typeof responseBody !== 'object' || responseBody === null) {
		return undefined;
	}
	const errors = isRecord(responseBody) ? responseBody['errors'] : undefined;
	if (!Array.isArray(errors) || errors.length === 0) {
		return undefined;
	}
	const first: unknown = errors[0];
	return isRecord(first) ? first : undefined;
}

function describeError({ status, responseBody }: { status: number; responseBody: unknown }): string {
	const first = firstError(responseBody);
	const vendorMessage =
		typeof first?.['message'] === 'string' && first['message'].length > 0
			? first['message']
			: typeof first?.['code'] === 'string'
			? first['code']
			: typeof responseBody === 'string' && responseBody.length > 0
			? responseBody
			: undefined;
	const hint =
		status === 401
			? ' Check the access token and the region, then reconnect Intercom.'
			: status === 403 && errorCode(responseBody) !== 'action_forbidden'
			? ' The Intercom app behind this connection lacks the permission for this action; add it in the Developer Hub and reconnect.'
			: '';
	const text = vendorMessage ?? 'No error details returned.';
	return `${text.length > MAX_ERROR_TEXT ? `${text.slice(0, MAX_ERROR_TEXT)}...` : text}${hint}`;
}

type IntercomHttpResult<T = unknown> =
	| { ok: true; status: number; body: T; headers: Record<string, unknown> }
	| { ok: false; status: number; body: unknown };

export type IntercomMe = {
	type?: string;
	id: string | number;
	name?: string;
	email?: string;
	app?: { id_code?: string; name?: string; region?: string };
};

export const intercomSdkFetcher: FetchFunction = async <R>(args: Fetcher.Args) => {
	const baseHeaders: Record<string, string> = {};
	for (const [key, value] of Object.entries(args.headers ?? {})) {
		if (value !== undefined && value !== null) {
			baseHeaders[key] = value;
		}
	}
	if (args.body !== undefined && args.contentType) {
		baseHeaders['Content-Type'] = args.contentType;
	}
	try {
		const response = await sendIntercomHttp<R>({
			method: toHttpMethod(args.method),
			url: args.url,
			headers: baseHeaders,
			queryParams: sdkQueryParams(args.queryParameters),
			body: args.body,
			timeout: args.timeoutMs,
		});
		if (response.ok) {
			return { ok: true as const, body: response.body, headers: response.headers };
		}
		return {
			ok: false as const,
			error: { reason: 'status-code' as const, statusCode: response.status, body: response.body },
		};
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			return { ok: false as const, error: { reason: 'timeout' as const } };
		}
		return {
			ok: false as const,
			error: { reason: 'unknown' as const, errorMessage: error instanceof Error ? error.message : String(error) },
		};
	}
};

export const intercomHttpInternals = {
	sleep: (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
};

export const INTERCOM_API_VERSION = '2.11';

export type IntercomAuthValue = AppConnectionValueForAuthProperty<typeof intercomAuth>;
