import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

const REQUEST_TIMEOUT_MS = 60_000;
const RATE_LIMIT_BACKOFF_MS = [5_000, 15_000];
const MAX_VENDOR_MESSAGE_LENGTH = 300;

const ERROR_HINTS: Record<number, string> = {
	400: 'Check the input values and that every source URL is publicly reachable.',
	401: 'The API key was rejected. Copy a fresh key from app.pdf.co and reconnect.',
	402: 'The PDF.co account is out of credits. Top up at app.pdf.co.',
	403: 'PDF.co could not open the source URL (access forbidden). Make the file public or set the HTTP username and password.',
	404: 'PDF.co could not find the requested resource or job.',
	408: 'PDF.co timed out waiting for the request. Try again.',
	429: 'PDF.co rate limit reached. Wait a minute and try again.',
	441: 'The PDF password is wrong or missing.',
	442: 'The input document is damaged or not the expected file type.',
	443: 'The document security settings do not allow this operation.',
	444: 'The profiles value could not be parsed.',
	445: 'The job took longer than 30 seconds. Turn on "Run in Background" or limit the pages.',
	446: 'Some files needed for the conversion are missing.',
	447: 'The template is invalid.',
	448: 'The URL or HTML is invalid or not reachable.',
	449: 'A page index is out of range. Check whether this action counts pages from 0 or from 1.',
	450: 'The page range is invalid. Check whether this action counts pages from 0 or from 1.',
	452: 'The URL is invalid.',
	454: 'One or more parameters are invalid.',
};

function readRecord(value: unknown): Record<string, unknown> {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return {};
	}
	return Object.fromEntries(Object.entries(value));
}

function numberOrUndefined(value: unknown): number | undefined {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === 'string' && /^\d{3}$/.test(value)) {
		return Number(value);
	}
	return undefined;
}

function collectSecrets({ value, apiKey }: { value: unknown; apiKey: string }): string[] {
	const secrets = new Set<string>();
	if (apiKey.length > 0) {
		secrets.add(apiKey);
	}
	const visit = ({ node, key }: { node: unknown; key: string }): void => {
		if (typeof node === 'string') {
			if (/pass(word)?/i.test(key) && node.length > 0) {
				secrets.add(node);
			}
			return;
		}
		if (Array.isArray(node)) {
			node.forEach((item) => visit({ node: item, key }));
			return;
		}
		if (typeof node === 'object' && node !== null) {
			Object.entries(node).forEach(([childKey, child]) => visit({ node: child, key: childKey }));
		}
	};
	visit({ node: value, key: '' });
	return [...secrets].sort((a, b) => b.length - a.length);
}

function redact({ text, secrets }: { text: string; secrets: string[] }): string {
	return secrets.reduce((current, secret) => current.split(secret).join('***'), text);
}

function vendorMessage(body: unknown): string | undefined {
	const record = readRecord(body);
	const message = record['message'];
	if (typeof message === 'string' && message.trim() !== '') {
		return message.trim().slice(0, MAX_VENDOR_MESSAGE_LENGTH);
	}
	if (typeof body === 'string' && body.trim() !== '' && !body.trim().startsWith('<')) {
		return body.trim().slice(0, MAX_VENDOR_MESSAGE_LENGTH);
	}
	return undefined;
}

function buildPdfCoError({
	httpStatus,
	body,
	secrets,
}: {
	httpStatus: number;
	body: unknown;
	secrets: string[];
}): PdfCoError {
	const record = readRecord(body);
	const errorCode = numberOrUndefined(record['errorCode']) ?? numberOrUndefined(record['status']);
	const code = errorCode ?? httpStatus;
	const vendor = vendorMessage(body);
	const hint = ERROR_HINTS[code] ?? ERROR_HINTS[httpStatus];
	const parts = [`PDF.co request failed (${code})`];
	if (vendor !== undefined) {
		parts.push(`: ${vendor}`);
	}
	if (vendor === undefined || !/[.!?]$/.test(vendor)) {
		parts.push('.');
	}
	if (hint !== undefined) {
		parts.push(` ${hint}`);
	}
	const message = redact({ text: parts.join(''), secrets });
	const safeBody = vendor === undefined ? undefined : { errorCode: code, message: redact({ text: vendor, secrets }) };
	return new PdfCoError({ message, status: httpStatus, errorCode: code, responseBody: safeBody });
}

function httpErrorDetails(error: unknown): { status: number; body: unknown } | undefined {
	if (typeof error !== 'object' || error === null || !('response' in error)) {
		return undefined;
	}
	const response = readRecord(error.response);
	const status = response['status'];
	if (typeof status !== 'number') {
		return undefined;
	}
	return { status, body: response['body'] };
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function serializeProfiles(profiles: unknown): string | undefined {
	if (typeof profiles === 'string') {
		return profiles.trim() === '' ? undefined : profiles;
	}
	if (typeof profiles === 'object' && profiles !== null) {
		return Object.keys(profiles).length === 0 ? undefined : JSON.stringify(profiles);
	}
	return undefined;
}

function apiKeyOf(auth: { secret_text: string }): string {
	return auth.secret_text.trim();
}

function pdfCoHeaders(apiKey: string): Record<string, string> {
	return { 'x-api-key': apiKey };
}

function assertApiPath(path: string): void {
	if (!/^\/v[12]\/[A-Za-z0-9/_-]+$/.test(path)) {
		throw new Error(`Invalid PDF.co API path "${path}".`);
	}
}

function statusOf(error: unknown): number | undefined {
	if (error instanceof PdfCoError) {
		return error.status;
	}
	return httpErrorDetails(error)?.status;
}

async function pdfCoRequest<T>({
	apiKey,
	method,
	path,
	body,
	queryParams,
	timeoutMs = REQUEST_TIMEOUT_MS,
}: {
	apiKey: string;
	method: HttpMethod;
	path: string;
	body?: Record<string, unknown>;
	queryParams?: QueryParams;
	timeoutMs?: number;
}): Promise<T> {
	assertApiPath(path);
	const secrets = collectSecrets({ value: body, apiKey });
	const headers: Record<string, string> = { ...pdfCoHeaders(apiKey), Accept: 'application/json' };
	if (body !== undefined) {
		headers['Content-Type'] = 'application/json';
	}
	for (let attempt = 0; ; attempt++) {
		try {
			const response = await httpClient.sendRequest<T>({
				method,
				url: `${PDF_CO_ORIGIN}${path}`,
				headers,
				body,
				queryParams,
				timeout: timeoutMs,
				followRedirects: false,
			});
			const record = readRecord(response.body);
			if (response.status < 200 || response.status >= 300 || record['error'] === true) {
				throw buildPdfCoError({ httpStatus: response.status, body: response.body, secrets });
			}
			return response.body;
		} catch (error) {
			if (error instanceof PdfCoError) {
				throw error;
			}
			const details = httpErrorDetails(error);
			if (details === undefined) {
				const reason = error instanceof Error ? error.message : String(error);
				throw new Error(redact({ text: `Could not reach PDF.co: ${reason}`, secrets }));
			}
			const backoff = RATE_LIMIT_BACKOFF_MS[attempt];
			if (details.status === 429 && backoff !== undefined) {
				await sleep(backoff);
				continue;
			}
			throw buildPdfCoError({ httpStatus: details.status, body: details.body, secrets });
		}
	}
}

export const pdfCoClient = {
	request: pdfCoRequest,
	buildError: buildPdfCoError,
	httpErrorDetails,
	readRecord,
	redact,
	sleep,
	apiKeyOf,
	headers: pdfCoHeaders,
	statusOf,
	serializeProfiles,
};

export class PdfCoError extends Error {
	readonly status: number;
	readonly errorCode: number | undefined;
	readonly responseBody: unknown;

	constructor({
		message,
		status,
		errorCode,
		responseBody,
	}: {
		message: string;
		status: number;
		errorCode?: number;
		responseBody?: unknown;
	}) {
		super(message);
		this.name = 'PdfCoError';
		this.status = status;
		this.errorCode = errorCode;
		this.responseBody = responseBody;
	}
}

export const PDF_CO_ORIGIN = 'https://api.pdf.co';
export const PDF_CO_BASE_URL = `${PDF_CO_ORIGIN}/v1`;
