import { createHash, createSign } from 'node:crypto';

import { AppConnectionType } from '@activepieces/pieces-framework';

import type {
	GoogleDocumentAiAuthValue,
	GoogleDocumentAiFieldViolation,
	GoogleDocumentAiResolvedAuth,
	GoogleDocumentAiServiceAccountKey,
	GoogleDocumentAiServiceAccountKeyFile,
	GoogleDocumentAiServiceAccountProps,
} from './types';

function baseUrl({ auth }: { auth: GoogleDocumentAiAuthValue | undefined }): string {
	try {
		return apiRoot(normalizeLocation(connectionLocation(auth)));
	} catch {
		return apiRoot('us');
	}
}

async function request<T>({
	auth,
	method,
	path,
	query,
	body,
	timeoutMs,
	timeoutHint,
	isExpected,
}: RequestParams & {
	auth: GoogleDocumentAiResolvedAuth;
	isExpected: (value: unknown) => value is T;
}): Promise<T> {
	const signal = AbortSignal.timeout(timeoutMs);
	const headers: Record<string, string> = {
		Authorization: `Bearer ${auth.accessToken}`,
		Accept: 'application/json',
	};
	if (body !== undefined) {
		headers['Content-Type'] = 'application/json';
	}
	let response: Response;
	try {
		response = await fetch(
			buildUrl({ url: `${apiRoot(auth.location)}/${API_VERSION}${path}`, query }),
			{
				method,
				headers,
				...(body !== undefined ? { body: JSON.stringify(body) } : {}),
				signal,
			},
		);
	} catch (error) {
		if (isDeadlineExceeded({ error, signal })) {
			throw timeoutError({ timeoutMs, hint: timeoutHint });
		}
		throw new Error(
			`Could not reach Google Document AI: ${
				error instanceof Error ? error.message : 'network error'
			}`,
		);
	}
	let text: string;
	try {
		text = await response.text();
	} catch (error) {
		if (isDeadlineExceeded({ error, signal })) {
			throw timeoutError({ timeoutMs, hint: timeoutHint });
		}
		throw new Error(`Google Document AI returned ${response.status} with an unreadable body.`);
	}
	const parsed = text === '' ? undefined : safeJson(text);
	if (!response.ok) {
		throw GoogleDocumentAiApiError.fromResponse({ status: response.status, body: parsed });
	}
	if (!isExpected(parsed)) {
		throw new Error(
			`Google Document AI returned ${response.status} with an unexpected response body.`,
		);
	}
	return parsed;
}

async function resolveAuth({
	auth,
}: {
	auth: GoogleDocumentAiAuthValue | undefined;
}): Promise<GoogleDocumentAiResolvedAuth> {
	if (!auth) {
		throw new Error('A Google Document AI connection is required.');
	}
	if (auth.type === AppConnectionType.CUSTOM_AUTH) {
		return await resolveServiceAccount({ props: auth.props });
	}
	if (!auth.access_token) {
		throw new Error('The Google Document AI connection has no access token; reconnect it.');
	}
	return {
		accessToken: auth.access_token,
		projectId: normalizeProjectId(stringProp({ props: auth.props, key: 'projectId' })),
		location: normalizeLocation(stringProp({ props: auth.props, key: 'location' })),
	};
}

async function authHeaders({
	auth,
	url,
}: {
	auth: GoogleDocumentAiAuthValue;
	url: string;
}): Promise<Record<string, string>> {
	assertConnectionHost({ url, root: apiRoot(normalizeLocation(connectionLocation(auth))) });
	const { accessToken } = await resolveAuth({ auth });
	return { Authorization: `Bearer ${accessToken}` };
}

function apiRoot(location: string): string {
	return `https://${location}-documentai.googleapis.com`;
}

function normalizeLocation(value: string | undefined): string {
	const location = String(value ?? '')
		.trim()
		.toLowerCase();
	if (location === '') return DEFAULT_LOCATION;
	if (!/^[a-z][a-z0-9-]*$/.test(location)) {
		throw new Error(`Invalid location "${value}": use a Document AI location id such as us or eu.`);
	}
	return location;
}

function normalizeProjectId(value: string | undefined): string {
	const projectId = String(value ?? '').trim();
	if (projectId === '') {
		throw new Error('The connection has no Google Cloud project ID.');
	}
	if (!/^[a-z0-9][a-z0-9:.-]*$/i.test(projectId)) {
		throw new Error(
			`Invalid project ID "${value}": use the project ID shown in Google Cloud Console (e.g. my-company-prod).`,
		);
	}
	return projectId;
}

function connectionLocation(auth: GoogleDocumentAiAuthValue | undefined): string | undefined {
	if (!auth) return undefined;
	if (auth.type === AppConnectionType.CUSTOM_AUTH) return auth.props.location;
	return stringProp({ props: auth.props, key: 'location' });
}

function stringProp({
	props,
	key,
}: {
	props: Record<string, unknown> | undefined;
	key: string;
}): string | undefined {
	const value = props?.[key];
	return typeof value === 'string' ? value : undefined;
}

async function resolveServiceAccount({
	props,
}: {
	props: GoogleDocumentAiServiceAccountProps;
}): Promise<GoogleDocumentAiResolvedAuth> {
	const key = parseServiceAccountKey(props.keyFile);
	const projectId = normalizeProjectId(props.projectId?.trim() ? props.projectId : key.projectId);
	return {
		accessToken: await mintServiceAccountToken({ key, scopes: [DOCUMENT_AI_SCOPE] }),
		projectId,
		location: normalizeLocation(props.location),
	};
}

function assertConnectionHost({ url, root }: { url: string; root: string }): void {
	if (!url.startsWith('http://') && !url.startsWith('https://')) return;
	const origin = originOf(url);
	if (origin === new URL(root).origin) return;
	throw new Error(
		`Custom API Call only sends the connection's Google credentials to ${root}, but the URL points to ${
			origin ?? 'an invalid address'
		}. Use a path such as /${API_VERSION}/projects/{project}/locations/{location}/processors, or a full URL on ${root}.`,
	);
}

function originOf(url: string): string | undefined {
	try {
		return new URL(url).origin;
	} catch {
		return undefined;
	}
}

function hintFor({
	status,
	reason,
	message,
}: {
	status: number;
	reason: string | undefined;
	message: string | undefined;
}): string {
	const text = `${reason ?? ''} ${message ?? ''}`;
	if (reason === 'SERVICE_DISABLED' || /has not been used in project|is disabled/i.test(text)) {
		return ' Enable the Cloud Document AI API in the Google Cloud project of the connection.';
	}
	if (reason === 'BILLING_DISABLED' || /billing/i.test(text)) {
		return ' Document AI needs billing enabled on the Google Cloud project.';
	}
	if (status === 403) {
		return " Grant the connection's account the role Document AI API User (roles/documentai.apiUser) on the project.";
	}
	if (status === 404 && /processor/i.test(text)) {
		return " Check the processor ID and that the connection's project and location match where the processor was created.";
	}
	if (/page|pages/i.test(text) && /limit|exceed|maximum/i.test(text)) {
		return ' Online processing accepts up to 15 pages (30 with Imageless Mode); select pages or split the file.';
	}
	return '';
}

function safeJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function optionalString(value: unknown): string | undefined {
	return typeof value === 'string' ? value : undefined;
}

function parseGoogleError(value: unknown): ParsedGoogleError {
	const error = isRecord(value) ? value['error'] : undefined;
	if (!isRecord(error)) {
		return { status: undefined, message: undefined, details: [] };
	}
	const details = Array.isArray(error['details']) ? error['details'] : [];
	return {
		status: optionalString(error['status']),
		message: optionalString(error['message']),
		details: details.filter(isRecord).map((detail) => ({
			reason: optionalString(detail['reason']),
			fieldViolations: Array.isArray(detail['fieldViolations'])
				? detail['fieldViolations'].filter(isRecord).map((violation) => {
						const field = optionalString(violation['field']);
						const description = optionalString(violation['description']);
						return {
							...(field !== undefined ? { field } : {}),
							...(description !== undefined ? { description } : {}),
						};
				  })
				: [],
		})),
	};
}

function truncate(text: string): string {
	return text.length > MAX_RAW_ERROR_LENGTH ? `${text.slice(0, MAX_RAW_ERROR_LENGTH)}...` : text;
}

function buildUrl({
	url,
	query,
}: {
	url: string;
	query: Record<string, string | number | undefined> | undefined;
}): string {
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(query ?? {})) {
		if (value === undefined || value === '') continue;
		search.set(key, String(value));
	}
	const text = search.toString();
	return text === '' ? url : `${url}?${text}`;
}

function isDeadlineExceeded({ error, signal }: { error: unknown; signal: AbortSignal }): boolean {
	return (
		signal.aborted ||
		(error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError'))
	);
}

function timeoutError({ timeoutMs, hint }: { timeoutMs: number; hint: string | undefined }): Error {
	return new Error(
		`Google Document AI did not answer within ${Math.round(
			timeoutMs / 1000,
		)} seconds. Try again in a moment.${hint ? ` ${hint}` : ''}`,
	);
}

function normalizePrivateKey(value: string): string {
	const key = String(value ?? '')
		.trim()
		.replace(/^"|"$/g, '')
		.replace(/\\n/g, '\n');
	if (!key.includes('-----BEGIN') || !key.includes('PRIVATE KEY-----')) {
		throw new Error(
			'The private key must be the PEM block of the service account key file (-----BEGIN PRIVATE KEY----- … -----END PRIVATE KEY-----).',
		);
	}
	return key;
}

function parseServiceAccountKey(raw: string): GoogleDocumentAiServiceAccountKey {
	const text = String(raw ?? '')
		.trim()
		.replace(/^```(?:json)?\s*/i, '')
		.replace(/\s*```$/, '');
	if (text === '') {
		throw new Error('Paste the service account key file (JSON) into the connection.');
	}
	let parsed: GoogleDocumentAiServiceAccountKeyFile | string | number | boolean | null;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error(
			'The service account key is not valid JSON: paste the whole file downloaded from Google Cloud (it starts with { "type": "service_account", …).',
		);
	}
	if (typeof parsed !== 'object' || parsed === null) {
		throw new Error('The service account key must be a JSON object.');
	}
	if (parsed.type !== undefined && parsed.type !== 'service_account') {
		throw new Error(
			`The key file has type "${String(
				parsed.type,
			)}"; a service account key has type "service_account".`,
		);
	}
	const clientEmail = typeof parsed.client_email === 'string' ? parsed.client_email.trim() : '';
	const privateKey = typeof parsed.private_key === 'string' ? parsed.private_key : '';
	if (!clientEmail || !privateKey) {
		throw new Error('The service account key must contain client_email and private_key.');
	}
	const projectId =
		typeof parsed.project_id === 'string' && parsed.project_id.trim() !== ''
			? parsed.project_id.trim()
			: undefined;
	return {
		clientEmail,
		privateKey: normalizePrivateKey(privateKey),
		...(projectId ? { projectId } : {}),
	};
}

function buildAssertion({
	key,
	scopes,
	now,
}: {
	key: GoogleDocumentAiServiceAccountKey;
	scopes: string[];
	now: number;
}): string {
	const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
	const claims = base64Url(
		JSON.stringify({
			iss: key.clientEmail.trim(),
			scope: scopes.join(' '),
			aud: GOOGLE_TOKEN_URL,
			iat: now,
			exp: now + JWT_LIFETIME_SECONDS,
		}),
	);
	const input = `${header}.${claims}`;
	const signature = createSign('RSA-SHA256')
		.update(input)
		.end()
		.sign(normalizePrivateKey(key.privateKey), 'base64url');
	return `${input}.${signature}`;
}

async function mintServiceAccountToken({
	key,
	scopes,
}: {
	key: GoogleDocumentAiServiceAccountKey;
	scopes: string[];
}): Promise<string> {
	const cacheKey = `${key.clientEmail.trim()}|${privateKeyFingerprint(
		key.privateKey,
	)}|${scopes.join(' ')}`;
	const cached = readCachedToken({ cacheKey, now: Math.floor(Date.now() / 1000) });
	if (cached) {
		return cached;
	}
	const inFlight = pendingExchanges.get(cacheKey);
	if (inFlight) {
		return await inFlight;
	}
	const exchange = mintAndCache({ key, scopes, cacheKey }).finally(() => {
		if (pendingExchanges.get(cacheKey) === exchange) {
			pendingExchanges.delete(cacheKey);
		}
	});
	pendingExchanges.set(cacheKey, exchange);
	return await exchange;
}

async function mintAndCache({
	key,
	scopes,
	cacheKey,
}: {
	key: GoogleDocumentAiServiceAccountKey;
	scopes: string[];
	cacheKey: string;
}): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	const { accessToken, expiresIn } = await exchangeAssertion({
		assertion: buildAssertion({ key, scopes, now }),
	});
	storeCachedToken({ cacheKey, token: { accessToken, expiresAt: now + expiresIn }, now });
	return accessToken;
}

function privateKeyFingerprint(privateKey: string): string {
	return createHash('sha256').update(normalizePrivateKey(privateKey)).digest('hex');
}

function base64Url(input: string | Buffer): string {
	return Buffer.from(input).toString('base64url');
}

async function exchangeAssertion({
	assertion,
}: {
	assertion: string;
}): Promise<{ accessToken: string; expiresIn: number }> {
	const signal = AbortSignal.timeout(TOKEN_REQUEST_TIMEOUT_MS);
	let response: Response;
	try {
		response = await fetch(GOOGLE_TOKEN_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
				assertion,
			}).toString(),
			signal,
		});
	} catch (error) {
		if (isDeadlineExceeded({ error, signal })) {
			throw new Error(TOKEN_TIMEOUT_MESSAGE);
		}
		throw new Error(
			`Could not reach the Google token endpoint: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}
	const body = await readTokenBody({ response, signal });
	if (!response.ok) {
		throw new Error(describeTokenError({ status: response.status, body }));
	}
	const accessToken = isRecord(body) ? optionalString(body['access_token']) : undefined;
	if (!accessToken) {
		const code = isRecord(body) ? optionalString(body['error']) : undefined;
		const description = isRecord(body) ? optionalString(body['error_description']) : undefined;
		throw new Error(
			`Google token endpoint returned no access token${
				code ? ` (${code}: ${description ?? ''})` : ''
			}.`,
		);
	}
	const expiresIn = isRecord(body) ? body['expires_in'] : undefined;
	return {
		accessToken,
		expiresIn: typeof expiresIn === 'number' && expiresIn > 0 ? expiresIn : JWT_LIFETIME_SECONDS,
	};
}

async function readTokenBody({
	response,
	signal,
}: {
	response: Response;
	signal: AbortSignal;
}): Promise<unknown> {
	try {
		const parsed: unknown = await response.json();
		return parsed;
	} catch (error) {
		if (isDeadlineExceeded({ error, signal })) {
			throw new Error(TOKEN_TIMEOUT_MESSAGE);
		}
		return undefined;
	}
}

function describeTokenError({ status, body }: { status: number; body: unknown }): string {
	if (isRecord(body)) {
		const code = optionalString(body['error']);
		const description = optionalString(body['error_description']);
		const hint =
			code === 'invalid_grant'
				? ' Check that the key was not deleted or disabled in Google Cloud and that the server clock is right.'
				: code === 'invalid_client'
				? ' The client_email of the key file was not recognised; paste the whole key file again.'
				: '';
		return `Google rejected the service account (${code ?? status}): ${
			description ?? ''
		}${hint}`.trim();
	}
	return `Google token endpoint returned ${status}.`;
}

function readCachedToken({ cacheKey, now }: { cacheKey: string; now: number }): string | undefined {
	sweepExpiredTokens({ now });
	return tokenCache.get(cacheKey)?.accessToken;
}

function storeCachedToken({
	cacheKey,
	token,
	now,
}: {
	cacheKey: string;
	token: CachedToken;
	now: number;
}): void {
	sweepExpiredTokens({ now });
	tokenCache.delete(cacheKey);
	tokenCache.set(cacheKey, token);
	for (const oldest of tokenCache.keys()) {
		if (tokenCache.size <= MAX_CACHED_TOKENS) break;
		tokenCache.delete(oldest);
	}
}

function sweepExpiredTokens({ now }: { now: number }): void {
	for (const [cacheKey, token] of tokenCache) {
		if (token.expiresAt - REFRESH_MARGIN_SECONDS <= now) {
			tokenCache.delete(cacheKey);
		}
	}
}

class GoogleDocumentAiApiError extends Error {
	readonly status: number;
	readonly googleStatus: string | undefined;
	readonly reason: string | undefined;
	readonly googleMessage: string | undefined;
	readonly fieldViolations: GoogleDocumentAiFieldViolation[];

	constructor({
		status,
		googleStatus,
		reason,
		googleMessage,
		fieldViolations,
		summary,
	}: GoogleDocumentAiApiErrorParams) {
		super(summary);
		this.name = 'GoogleDocumentAiApiError';
		this.status = status;
		this.googleStatus = googleStatus;
		this.reason = reason;
		this.googleMessage = googleMessage;
		this.fieldViolations = fieldViolations;
	}

	static fromResponse({
		status,
		body,
	}: {
		status: number;
		body: unknown;
	}): GoogleDocumentAiApiError {
		const parsed = parseGoogleError(body);
		const googleStatus = parsed.status;
		const googleMessage = parsed.message;
		const reason = parsed.details.find((d) => d.reason !== undefined)?.reason;
		const fieldViolations = parsed.details.flatMap((d) => d.fieldViolations);

		const head = `Google Document AI returned ${status}${googleStatus ? ` (${googleStatus})` : ''}`;
		const detail =
			googleMessage ?? truncate(typeof body === 'string' ? body : JSON.stringify(body ?? null));
		const violations =
			fieldViolations.length > 0
				? ` [${fieldViolations.map((v) => `${v.field ?? '?'}: ${v.description ?? ''}`).join('; ')}]`
				: '';
		const hint = hintFor({ status, reason, message: googleMessage });
		return new GoogleDocumentAiApiError({
			status,
			googleStatus,
			reason,
			googleMessage,
			fieldViolations,
			summary: `${head}: ${detail}${violations}${reason ? ` [reason: ${reason}]` : ''}${hint}`,
		});
	}
}

const DOCUMENT_AI_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const DEFAULT_LOCATION = 'us';

export const googleDocumentAiClient = {
	baseUrl,
	request,
	resolveAuth,
	authHeaders,
	DOCUMENT_AI_SCOPE,
	DEFAULT_LOCATION,
};

const API_VERSION = 'v1';
const MAX_RAW_ERROR_LENGTH = 500;
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const JWT_LIFETIME_SECONDS = 3600;
const REFRESH_MARGIN_SECONDS = 300;
const MAX_CACHED_TOKENS = 100;
const TOKEN_REQUEST_TIMEOUT_MS = 30_000;
const TOKEN_TIMEOUT_MESSAGE =
	'Google token endpoint did not answer within 30 seconds. Try again in a moment.';

const tokenCache = new Map<string, CachedToken>();
const pendingExchanges = new Map<string, Promise<string>>();

type RequestParams = {
	method: 'GET' | 'POST';
	path: string;
	query?: Record<string, string | number | undefined>;
	body?: unknown;
	timeoutMs: number;
	timeoutHint?: string;
};

type CachedToken = { accessToken: string; expiresAt: number };

type ParsedGoogleError = {
	status: string | undefined;
	message: string | undefined;
	details: { reason: string | undefined; fieldViolations: GoogleDocumentAiFieldViolation[] }[];
};

type GoogleDocumentAiApiErrorParams = {
	status: number;
	googleStatus: string | undefined;
	reason: string | undefined;
	googleMessage: string | undefined;
	fieldViolations: GoogleDocumentAiFieldViolation[];
	summary: string;
};
