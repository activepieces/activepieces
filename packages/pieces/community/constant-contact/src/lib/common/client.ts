import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { ActivityKind, CcMethod, CcPage, CcQuery, CcScope, ContactChanges, CustomFieldValue, UnknownRecord, ccData } from './types';

function verifiedTlsDispatcher(): Promise<unknown> {
	verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
	return verifiedTlsAgent;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function segment(value: string): string {
	return encodeURIComponent(value);
}

function assertRelativePath(path: string): void {
	if (!path.startsWith('/') || path.startsWith('//') || path.includes('?') || path.includes('#') || path.includes('\\') || path.split('/').some((part) => part === '..' || part === '.')) {
		throw new Error('Refusing to send a Constant Contact request to an unexpected path.');
	}
}

function buildUrl({ path, query }: { path: string; query?: CcQuery }): string {
	assertRelativePath(path);
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query ?? {})) {
		if (value !== undefined && value !== null && value !== '') {
			params.append(key, String(value));
		}
	}
	const text = params.toString();
	return `${CONSTANT_CONTACT_API_URL}${path}${text === '' ? '' : `?${text}`}`;
}

function vendorErrors(responseBody: unknown): { key?: string; message?: string }[] {
	const entries: unknown[] = Array.isArray(responseBody) ? responseBody : [responseBody];
	return entries
		.filter(ccData.isRecord)
		.map((entry) => ({ key: ccData.textAt({ value: entry, key: 'error_key' }), message: ccData.textAt({ value: entry, key: 'error_message' }) }))
		.filter((entry) => entry.key !== undefined || entry.message !== undefined);
}

function vendorMessage(responseBody: unknown): string {
	if (typeof responseBody === 'string') {
		const text = responseBody.trim();
		return text === '' ? 'no details returned' : text.slice(0, MAX_ERROR_TEXT);
	}
	const parts = vendorErrors(responseBody).map((entry) => (entry.message ?? entry.key ?? '').trim()).filter((text) => text !== '');
	return parts.length === 0 ? 'no details returned' : parts.join('; ').slice(0, MAX_ERROR_TEXT);
}

function vendorErrorKey(responseBody: unknown): string | undefined {
	return vendorErrors(responseBody).find((entry) => entry.key !== undefined)?.key;
}

function statusHint({ status, errorKey, requiredScope }: { status: number; errorKey: string | undefined; requiredScope: CcScope }): string {
	if (status === 401) {
		return 'The access token was rejected or has expired. Reconnect the Constant Contact connection.';
	}
	if (status === 403) {
		if (requiredScope !== 'contact_data') {
			return `This action needs the "${requiredScope}" permission, which this piece only requests since version 0.4.0. Reconnect the Constant Contact connection to grant ${requiredScope}. If you already reconnected, the connected Constant Contact user may lack the privilege for this action.`;
		}
		return 'The connected Constant Contact user lacks the privilege for this action, or the app access was revoked. Reconnect, or ask the account owner for access.';
	}
	if (status === 404) {
		return 'Not found; check the ID.';
	}
	if (status === 409) {
		return 'It conflicts with an existing record, for example a duplicate name.';
	}
	if (status === 429) {
		return errorKey === 'quota_exceeded'
			? 'The daily limit of 10,000 Constant Contact API requests for this account is used up (shared with your other integrations); it resets at 00:00 UTC.'
			: 'Constant Contact rate limit reached (4 requests per second, or 1,000 queued activities); wait a moment and try again.';
	}
	if (status >= 500) {
		return 'Constant Contact server error; try again later.';
	}
	return '';
}

function parseBody(text: string): unknown {
	if (text.trim() === '') {
		return undefined;
	}
	try {
		return JSON.parse(text);
	} catch {
		return text.slice(0, MAX_ERROR_TEXT);
	}
}

function transportError({ error, operation, method }: { error: unknown; operation: string; method: CcMethod }): Error {
	const unknownOutcome = method === 'GET' ? '' : ' It may still have been applied; check Constant Contact before retrying.';
	if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
		return new ConstantContactNetworkError(`Constant Contact ${operation} did not respond within ${REQUEST_TIMEOUT_MS / 1000} seconds.${unknownOutcome}`);
	}
	const cause = error instanceof Error ? ccData.textAt({ value: error.cause, key: 'code' }) : undefined;
	const detail = cause ?? (error instanceof Error ? error.message.slice(0, 200) : String(error).slice(0, 200));
	return new ConstantContactNetworkError(`Could not reach Constant Contact for ${operation}: ${detail}.${unknownOutcome}`);
}

async function send({ url, method, headers, body, operation }: { url: string; method: CcMethod; headers: Record<string, string>; body: unknown; operation: string }): Promise<{ status: number; body: unknown }> {
	const dispatcher = await ccTransport.getDispatcher();
	const httpRequest: HttpRequest = {
		method: HTTP_METHODS[method],
		url,
		headers,
		timeout: REQUEST_TIMEOUT_MS,
		followRedirects: false,
		responseType: 'text',
		redactBodyInErrors: true,
	};
	if (body !== undefined) {
		httpRequest.body = body;
	}
	try {
		const response = await httpClient.sendRequest<string>(httpRequest, { dispatcher });
		return { status: response.status, body: parseBody(typeof response.body === 'string' ? response.body : '') };
	} catch (error) {
		const failed = failedResponseOf(error);
		if (failed === undefined) {
			throw transportError({ error, operation, method });
		}
		return { status: failed.status, body: typeof failed.body === 'string' ? parseBody(failed.body) : failed.body };
	}
}

function failedResponseOf(error: unknown): { status: number; body: unknown } | undefined {
	if (!(error instanceof Error)) {
		return undefined;
	}
	const response: unknown = Reflect.get(error, 'response');
	if (!ccData.isRecord(response) || typeof response['status'] !== 'number') {
		return undefined;
	}
	return { status: response['status'], body: response['body'] };
}

async function request({ accessToken, method, path, operation, query, body, requiredScope = 'contact_data' }: CcRequest): Promise<CcResponse> {
	const token = accessToken.trim();
	if (token === '') {
		throw new Error('The Constant Contact connection has no access token. Reconnect Constant Contact.');
	}
	const url = buildUrl({ path, query });
	const headers: Record<string, string> = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
	if (body !== undefined) {
		headers['Content-Type'] = 'application/json';
	}
	for (let attempt = 0; ; attempt++) {
		const response = await send({ url, method, headers, body, operation });
		if (response.status >= 200 && response.status < 300) {
			return response;
		}
		const errorKey = vendorErrorKey(response.body);
		if (response.status === 429 && errorKey !== 'quota_exceeded' && method !== 'POST' && attempt < RATE_LIMIT_RETRIES) {
			await ccTransport.sleep(RATE_LIMIT_WAIT_MS * (attempt + 1));
			continue;
		}
		if (response.status >= 300 && response.status < 400) {
			throw new ConstantContactApiError({ operation, status: response.status, responseBody: 'unexpected redirect, not followed', requiredScope });
		}
		throw new ConstantContactApiError({ operation, status: response.status, responseBody: response.body, requiredScope });
	}
}

function nextQuery({ body, path }: { body: unknown; path: string }): CcQuery | null {
	const href = ccData.textAt({ value: ccData.recordAt({ value: ccData.recordAt({ value: body, key: '_links' }), key: 'next' }), key: 'href' });
	if (href === undefined || href.trim() === '') {
		return null;
	}
	let url: URL;
	try {
		url = new URL(href, CONSTANT_CONTACT_ORIGIN);
	} catch {
		throw new Error('Constant Contact returned a next-page link that is not a valid URL; stopped paging.');
	}
	if (url.origin !== CONSTANT_CONTACT_ORIGIN || url.pathname !== `${API_PATH_PREFIX}${path}`) {
		throw new Error('Constant Contact returned a next-page link for a different host or path; stopped paging.');
	}
	const cursor = url.searchParams.get('cursor');
	if (cursor === null || cursor === '') {
		throw new Error('Constant Contact returned a next-page link without a cursor; stopped paging.');
	}
	return Object.fromEntries(url.searchParams.entries());
}

async function listPage({ accessToken, path, key, operation, query, requiredScope }: CcListRequest): Promise<CcPage> {
	const response = await request({ accessToken, method: 'GET', path, operation, query, requiredScope });
	const next = nextQuery({ body: response.body, path });
	const cursor = next === null ? null : next['cursor'];
	return { items: ccData.recordsAt({ value: response.body, key }), nextCursor: typeof cursor === 'string' ? cursor : null, body: response.body };
}

async function listAll({ accessToken, path, key, operation, query, requiredScope, maxItems }: CcListRequest & { maxItems: number }): Promise<UnknownRecord[]> {
	const startedAt = Date.now();
	let pageQuery: CcQuery | undefined = query;
	let items: UnknownRecord[] = [];
	for (;;) {
		const response = await request({ accessToken, method: 'GET', path, operation, query: pageQuery, requiredScope });
		items = [...items, ...ccData.recordsAt({ value: response.body, key })];
		const next = nextQuery({ body: response.body, path });
		if (next === null) {
			return items;
		}
		if (items.length >= maxItems) {
			throw new ConstantContactListCapError({ operation, maxItems });
		}
		if (Date.now() - startedAt > LIST_ALL_DEADLINE_MS) {
			throw new Error(`Constant Contact ${operation}: listing took longer than ${LIST_ALL_DEADLINE_MS / 1000} seconds; stopped instead of returning a partial list.`);
		}
		pageQuery = { ...query, ...next };
	}
}

function isUuid(value: string): boolean {
	return UUID.test(value);
}

async function resolveContactId({ accessToken, value, label, verify = false }: { accessToken: string; value: unknown; label: string; verify?: boolean }): Promise<string> {
	const text = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
	if (text === '') {
		throw new Error(`${label} is required.`);
	}
	if (isUuid(text)) {
		const id = text.toLowerCase();
		if (verify) {
			const response = await request({ accessToken, method: 'GET', path: `/contacts/${segment(id)}`, operation: 'check contact' });
			if (ccData.textAt({ value: response.body, key: 'deleted_at' }) !== undefined) {
				throw new Error(`${label}: contact ${id} is deleted.`);
			}
		}
		return id;
	}
	if (!EMAIL.test(text)) {
		throw new Error(`${label} must be a Constant Contact contact ID (a UUID) or an email address (got "${text.slice(0, 80)}").`);
	}
	const response = await request({ accessToken, method: 'GET', path: '/contacts', operation: 'find contact by email', query: { email: text } });
	const match = ccData
		.recordsAt({ value: response.body, key: 'contacts' })
		.find((contact) => (ccData.textAt({ value: ccData.recordAt({ value: contact, key: 'email_address' }), key: 'address' }) ?? '').toLowerCase() === text.toLowerCase());
	const id = ccData.textAt({ value: match, key: 'contact_id' });
	if (id === undefined) {
		throw new Error(`No Constant Contact contact has the email ${text} (deleted contacts are not matched).`);
	}
	return id;
}

async function getContact({ accessToken, contactId }: { accessToken: string; contactId: string }): Promise<UnknownRecord> {
	const response = await request({
		accessToken,
		method: 'GET',
		path: `/contacts/${segment(contactId)}`,
		operation: 'get contact',
		query: { include: CONTACT_INCLUDE },
	});
	if (!ccData.isRecord(response.body)) {
		throw new Error('Constant Contact returned no contact.');
	}
	return response.body;
}

function mergeByKind({ current, entry, label }: { current: UnknownRecord[]; entry: UnknownRecord; label: string }): UnknownRecord[] {
	const kind = ccData.textAt({ value: entry, key: 'kind' });
	const index = current.findIndex((item) => ccData.textAt({ value: item, key: 'kind' }) === kind);
	const merged = index === -1 ? [...current, entry] : current.map((item, position) => (position === index ? { ...item, ...entry } : item));
	if (merged.length > 3) {
		throw new Error(`A Constant Contact contact can have at most 3 ${label}; this contact already has 3 of other kinds.`);
	}
	return merged;
}

function pickDefined(record: UnknownRecord): UnknownRecord {
	return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && value !== null));
}

function buildPutBody({ current, changes, unsubscribe }: { current: UnknownRecord; changes: ContactChanges; unsubscribe?: { reason?: string } }): UnknownRecord {
	if (ccData.textAt({ value: current, key: 'deleted_at' }) !== undefined) {
		throw new Error('This contact is deleted. Updating it would restore it, so the update was not sent.');
	}
	const email = ccData.recordAt({ value: current, key: 'email_address' });
	const address = ccData.textAt({ value: email, key: 'address' });
	if (address === undefined) {
		throw new Error('Constant Contact returned the contact without an email address; the update was not sent.');
	}
	const pick = (key: keyof ContactChanges): unknown => changes[key] ?? current[key];
	const emailAddress = unsubscribe === undefined
		? pickDefined({ address, permission_to_send: ccData.textAt({ value: email, key: 'permission_to_send' }) })
		: pickDefined({ address, permission_to_send: 'unsubscribed', opt_out_reason: unsubscribe.reason });
	const phones = changes.phone === undefined
		? undefined
		: mergeByKind({
			current: ccData.recordsAt({ value: current, key: 'phone_numbers' }).map((phone) => pickDefined({ phone_number: phone['phone_number'], kind: phone['kind'] })),
			entry: { ...changes.phone },
			label: 'phone numbers',
		});
	const addresses = changes.street_address === undefined
		? undefined
		: mergeByKind({
			current: ccData.recordsAt({ value: current, key: 'street_addresses' }).map((item) =>
				pickDefined({ kind: item['kind'], street: item['street'], city: item['city'], state: item['state'], postal_code: item['postal_code'], country: item['country'] }),
			),
			entry: pickDefined({ ...changes.street_address }),
			label: 'street addresses',
		});
	const customFields = changes.custom_fields === undefined || changes.custom_fields.length === 0 ? undefined : mergeCustomFields({ current, changes: changes.custom_fields });
	const lists = changes.add_list_ids === undefined || changes.add_list_ids.length === 0 ? undefined : [...new Set([...ccData.stringsAt({ value: current, key: 'list_memberships' }), ...changes.add_list_ids])];
	if (lists !== undefined && lists.length > 50) {
		throw new Error('A Constant Contact contact can belong to at most 50 lists; this update would exceed that.');
	}
	return pickDefined({
		email_address: emailAddress,
		first_name: pick('first_name'),
		last_name: pick('last_name'),
		job_title: pick('job_title'),
		company_name: pick('company_name'),
		birthday_month: pick('birthday_month'),
		birthday_day: pick('birthday_day'),
		anniversary: pick('anniversary'),
		update_source: 'Account',
		phone_numbers: phones,
		street_addresses: addresses,
		custom_fields: customFields,
		list_memberships: lists,
	});
}

function mergeCustomFields({ current, changes }: { current: UnknownRecord; changes: CustomFieldValue[] }): UnknownRecord[] {
	const existing = ccData.recordsAt({ value: current, key: 'custom_fields' }).map((field) =>
		pickDefined({ custom_field_id: field['custom_field_id'], value: field['value'], choice_ids: field['choice_ids'] }),
	);
	const changedIds = new Set(changes.map((change) => change.custom_field_id));
	const merged = [...existing.filter((field) => !changedIds.has(String(field['custom_field_id']))), ...changes.map((change) => ({ ...change }))];
	if (merged.length > 25) {
		throw new Error('Constant Contact accepts at most 25 custom field values per contact update.');
	}
	return merged;
}

async function updateContact({ accessToken, contactId, changes, unsubscribe }: { accessToken: string; contactId: string; changes: ContactChanges; unsubscribe?: { reason?: string } }): Promise<UnknownRecord> {
	const current = await getContact({ accessToken, contactId });
	const body = buildPutBody({ current, changes, unsubscribe });
	await request({ accessToken, method: 'PUT', path: `/contacts/${segment(contactId)}`, operation: unsubscribe === undefined ? 'update contact' : 'unsubscribe contact', body });
	return getContact({ accessToken, contactId });
}

async function deleteContact({ accessToken, contactId }: { accessToken: string; contactId: string }): Promise<{ contact_id: string; deleted: boolean }> {
	await request({ accessToken, method: 'DELETE', path: `/contacts/${segment(contactId)}`, operation: 'delete contact' });
	return { contact_id: contactId, deleted: true };
}

function activityBody({ kind, contactIds, targetIds }: { kind: ActivityKind; contactIds: string[]; targetIds: string[] }): UnknownRecord {
	const source = { contact_ids: contactIds };
	return kind === 'add_list_memberships' || kind === 'remove_list_memberships' ? { source, list_ids: targetIds } : { source, tag_ids: targetIds };
}

function activityFailure(activity: unknown): string | undefined {
	const state = ccData.textAt({ value: activity, key: 'state' });
	const errors = ccData.stringsAt({ value: activity, key: 'activity_errors' });
	if (errors.length > 0) {
		return errors.join('; ').slice(0, MAX_ERROR_TEXT);
	}
	if (state !== undefined && FAILED_STATES.includes(state)) {
		return `the activity ended in state "${state}"`;
	}
	return undefined;
}

async function getActivity({ accessToken, activityId }: { accessToken: string; activityId: string }): Promise<UnknownRecord> {
	const response = await request({ accessToken, method: 'GET', path: `/activities/${segment(activityId)}`, operation: 'get activity status' });
	return ccData.isRecord(response.body) ? response.body : {};
}

async function runActivity({ accessToken, kind, contactIds, targetIds }: { accessToken: string; kind: ActivityKind; contactIds: string[]; targetIds: string[] }): Promise<UnknownRecord> {
	if (contactIds.length === 0 || contactIds.length > 500) {
		throw new Error('Give between 1 and 500 contacts.');
	}
	if (targetIds.length === 0 || targetIds.length > 50) {
		throw new Error(`Give between 1 and 50 ${kind.includes('list') ? 'lists' : 'tags'}.`);
	}
	const created = await request({ accessToken, method: 'POST', path: `/activities/${kind}`, operation: ACTIVITY_OPERATIONS[kind], body: activityBody({ kind, contactIds, targetIds }) });
	const activityId = ccData.textAt({ value: created.body, key: 'activity_id' });
	if (activityId === undefined) {
		throw new Error(`Constant Contact ${ACTIVITY_OPERATIONS[kind]}: the request was accepted but no activity ID came back. Check the contacts in Constant Contact before retrying.`);
	}
	let activity: UnknownRecord = ccData.isRecord(created.body) ? created.body : { activity_id: activityId };
	for (let poll = 0; poll < ACTIVITY_POLLS; poll++) {
		const failure = activityFailure(activity);
		if (failure !== undefined) {
			throw new Error(`Constant Contact ${ACTIVITY_OPERATIONS[kind]} failed (activity ${activityId}): ${failure}`);
		}
		if (ccData.textAt({ value: activity, key: 'state' }) === 'completed') {
			return activity;
		}
		await ccTransport.sleep(ACTIVITY_POLL_WAIT_MS);
		activity = await getActivity({ accessToken, activityId });
	}
	const failure = activityFailure(activity);
	if (failure !== undefined) {
		throw new Error(`Constant Contact ${ACTIVITY_OPERATIONS[kind]} failed (activity ${activityId}): ${failure}`);
	}
	return activity;
}

export class ConstantContactApiError extends Error {
	readonly status: number;
	readonly errorKey: string | undefined;
	readonly responseBody: unknown;

	constructor({ operation, status, responseBody, requiredScope = 'contact_data' }: { operation: string; status: number; responseBody: unknown; requiredScope?: CcScope }) {
		const errorKey = vendorErrorKey(responseBody);
		const hint = statusHint({ status, errorKey, requiredScope });
		super(`Constant Contact ${operation} failed (HTTP ${status}${errorKey === undefined ? '' : `, ${errorKey}`}): ${hint === '' ? '' : `${hint} `}${vendorMessage(responseBody)}`);
		this.name = 'ConstantContactApiError';
		this.status = status;
		this.errorKey = errorKey;
		this.responseBody = responseBody;
	}
}

export class ConstantContactListCapError extends Error {
	readonly maxItems: number;

	constructor({ operation, maxItems }: { operation: string; maxItems: number }) {
		super(`Constant Contact ${operation}: more than ${maxItems} records; stopped instead of returning a partial list. Narrow the request.`);
		this.name = 'ConstantContactListCapError';
		this.maxItems = maxItems;
	}
}

export class ConstantContactNetworkError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ConstantContactNetworkError';
	}
}

let verifiedTlsAgent: Promise<unknown> | undefined;

const REQUEST_TIMEOUT_MS = 60_000;
const HTTP_METHODS: Record<CcMethod, HttpMethod> = {
	GET: HttpMethod.GET,
	POST: HttpMethod.POST,
	PUT: HttpMethod.PUT,
	DELETE: HttpMethod.DELETE,
};
const MAX_ERROR_TEXT = 500;
const RATE_LIMIT_RETRIES = 2;
const RATE_LIMIT_WAIT_MS = 1_000;
const LIST_ALL_DEADLINE_MS = 240_000;
const CONSTANT_CONTACT_ORIGIN = 'https://api.cc.email';
const API_PATH_PREFIX = '/v3';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACTIVITY_POLLS = 6;
const ACTIVITY_POLL_WAIT_MS = 2_000;
const FAILED_STATES = ['failed', 'cancelled', 'timed_out'];
const ACTIVITY_OPERATIONS: Record<ActivityKind, string> = {
	add_list_memberships: 'add contacts to lists',
	remove_list_memberships: 'remove contacts from lists',
	contacts_taggings_add: 'add tags to contacts',
	contacts_taggings_remove: 'remove tags from contacts',
};

export const CONTACT_INCLUDE = 'custom_fields,list_memberships,phone_numbers,street_addresses,taggings';

export const CONSTANT_CONTACT_API_URL = `${CONSTANT_CONTACT_ORIGIN}${API_PATH_PREFIX}`;

export const ccTransport = {
	getDispatcher: verifiedTlsDispatcher,
	sleep,
};

export const ccClient = {
	request,
	listPage,
	listAll,
	segment,
	vendorMessage,
	isUuid,
};

export const ccContacts = {
	resolveContactId,
	getContact,
	buildPutBody,
	updateContact,
	deleteContact,
	runActivity,
	getActivity,
	activityFailure,
};

export type CcRequest = {
	accessToken: string;
	method: CcMethod;
	path: string;
	operation: string;
	query?: CcQuery;
	body?: unknown;
	requiredScope?: CcScope;
};

export type CcResponse = {
	status: number;
	body: unknown;
};

export type CcListRequest = {
	accessToken: string;
	path: string;
	key: string;
	operation: string;
	query?: CcQuery;
	requiredScope?: CcScope;
};
