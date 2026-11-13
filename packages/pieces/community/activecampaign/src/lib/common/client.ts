import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { CUSTOM_FIELD_TYPE } from './constants';
import {
	ContactCustomFieldsResponse,
	CreateAccountRequest,
	CreateContactRequest,
	CreateWebhookRequest,
	CreateWebhookResponse,
	ListPage,
	UnknownRecord,
	acData,
} from './types';

let verifiedTlsAgent: Promise<unknown> | undefined;

const REQUEST_TIMEOUT_MS = 60_000;
const MAX_ERROR_TEXT = 500;
const RATE_LIMIT_RETRIES = 2;
const MAX_RETRY_WAIT_SECONDS = 10;
const PAGE_LIMIT = 100;
const LIST_ALL_CAP = 1000;
const HTTP_METHODS: Record<HttpVerb, HttpMethod> = { GET: HttpMethod.GET, POST: HttpMethod.POST, PUT: HttpMethod.PUT, DELETE: HttpMethod.DELETE };
const DEAL_OWNER_REQUIRED = /auto-assign|owner id needs to be provided/i;

function normalizeApiUrl(raw: unknown): string {
	const text = typeof raw === 'string' ? raw.trim() : '';
	if (text === '') {
		throw new ActiveCampaignConfigError('The API URL is empty. Copy it from Settings > Developer in ActiveCampaign, for example https://youraccount.api-us1.com.');
	}
	const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text.replace(/^http:\/\//i, 'https://') : `https://${text}`;
	let url: URL;
	try {
		url = new URL(withScheme);
	} catch {
		throw new ActiveCampaignConfigError(`The API URL "${text.slice(0, 100)}" is not a valid URL. Use the URL from Settings > Developer, for example https://youraccount.api-us1.com.`);
	}
	if (url.protocol !== 'https:') {
		throw new ActiveCampaignConfigError('The API URL must start with https://, for example https://youraccount.api-us1.com.');
	}
	if (url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '') {
		throw new ActiveCampaignConfigError('The API URL must not contain a user name, password, query or fragment. Use the URL from Settings > Developer.');
	}
	const path = url.pathname.replace(/\/+$/, '').replace(/\/api\/3$/i, '').replace(/\/+$/, '');
	return `${url.origin}${path}`;
}

function verifiedTlsDispatcher(): Promise<unknown> {
	verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
	return verifiedTlsAgent;
}

function segment(value: string | number): string {
	return encodeURIComponent(String(value));
}

function buildQuery(query: QueryParams | undefined): string {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query ?? {})) {
		if (value !== undefined && value !== null && value !== '') {
			params.append(key, String(value));
		}
	}
	const text = params.toString();
	return text === '' ? '' : `?${text}`;
}

function vendorMessage(responseBody: unknown): string {
	if (typeof responseBody === 'string') {
		const trimmed = responseBody.trim();
		return trimmed === '' ? 'no details returned' : trimmed.slice(0, MAX_ERROR_TEXT);
	}
	if (!acData.isRecord(responseBody)) {
		return 'no details returned';
	}
	const errors = acData.recordsAt({ value: responseBody, key: 'errors' });
	const parts = errors
		.map((error) =>
			[acData.textAt({ value: error, key: 'title' }), acData.textAt({ value: error, key: 'detail' })]
				.filter((part): part is string => part !== undefined && part !== '')
				.join(': '),
		)
		.filter((text) => text !== '');
	if (parts.length > 0) {
		return parts.join(' - ').slice(0, MAX_ERROR_TEXT);
	}
	const message = acData.textAt({ value: responseBody, key: 'message' });
	if (message !== undefined && message !== '') {
		return message.slice(0, MAX_ERROR_TEXT);
	}
	return JSON.stringify(responseBody).slice(0, MAX_ERROR_TEXT);
}

function networkCode(error: unknown): string {
	if (!(error instanceof Error)) {
		return String(error).slice(0, 100);
	}
	if (error.name === 'TimeoutError' || error.name === 'AbortError') {
		return 'the request timed out';
	}
	const cause: unknown = error.cause;
	const code = acData.textAt({ value: cause, key: 'code' });
	return code ?? error.message.slice(0, 200);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request({ apiUrl, apiKey, method, path, query, body }: RequestParams): Promise<ApiResponse> {
	if (!path.startsWith('/') || path.startsWith('//') || path.split('/').some((part) => part === '..' || part === '.')) {
		throw new Error(`Internal error: ActiveCampaign path must be relative (${method}).`);
	}
	const baseUrl = normalizeApiUrl(apiUrl);
	const host = new URL(baseUrl).host;
	const url = `${baseUrl}/api/3${path}${buildQuery(query)}`;
	const headers: Record<string, string> = { 'Api-Token': String(apiKey ?? '').trim(), Accept: 'application/json' };
	if (body !== undefined) {
		headers['Content-Type'] = 'application/json';
	}
	const dispatcher = await verifiedTlsDispatcher();
	for (let attempt = 0; ; attempt++) {
		const outcome = await send({ url, method, headers, body, dispatcher, host });
		if (outcome.status >= 200 && outcome.status < 300) {
			return { status: outcome.status, body: outcome.body ?? {} };
		}
		if (outcome.status === 429 && method !== 'POST' && attempt < RATE_LIMIT_RETRIES) {
			await activeCampaignApi.sleep(Math.min(2 ** attempt, MAX_RETRY_WAIT_SECONDS) * 1000);
			continue;
		}
		throw new ActiveCampaignApiError({ method, path, status: outcome.status, responseBody: outcome.body });
	}
}

async function send({ url, method, headers, body, dispatcher, host }: SendParams): Promise<{ status: number; body: unknown }> {
	try {
		const response = await httpClient.sendRequest<unknown>(
			{
				method: HTTP_METHODS[method],
				url,
				headers,
				body,
				timeout: REQUEST_TIMEOUT_MS,
				followRedirects: false,
				redactBodyInErrors: true,
			},
			{ dispatcher },
		);
		return { status: response.status, body: response.body };
	} catch (error) {
		if (error instanceof HttpError) {
			return { status: error.response.status, body: error.response.body };
		}
		throw new ActiveCampaignNetworkError({ host, reason: networkCode(error) });
	}
}

async function listPage({ auth, path, key, query, limit, offset }: ListPageParams): Promise<ListPage> {
	const response = await request({ ...auth, method: 'GET', path, query: { ...query, limit, offset } });
	const items = acData.recordsAt({ value: response.body, key });
	const total = Number(acData.textAt({ value: acData.recordAt({ value: response.body, key: 'meta' }), key: 'total' }));
	const knownTotal = Number.isFinite(total) ? total : undefined;
	const hasMore = knownTotal !== undefined ? offset + items.length < knownTotal : items.length === limit;
	return { items, total: knownTotal ?? offset + items.length, offset, limit, hasMore };
}

async function listAll({ auth, path, key, query, cap = LIST_ALL_CAP, sideKeys = [] }: ListAllParams): Promise<ListAllResult> {
	let offset = 0;
	let items: UnknownRecord[] = [];
	let side: Record<string, UnknownRecord[]> = Object.fromEntries(sideKeys.map((sideKey) => [sideKey, []]));
	for (;;) {
		const response = await request({ ...auth, method: 'GET', path, query: { ...query, limit: PAGE_LIMIT, offset } });
		const page = acData.recordsAt({ value: response.body, key });
		items = [...items, ...page];
		side = Object.fromEntries(
			sideKeys.map((sideKey) => [sideKey, [...(side[sideKey] ?? []), ...acData.recordsAt({ value: response.body, key: sideKey })]]),
		);
		const total = Number(acData.textAt({ value: acData.recordAt({ value: response.body, key: 'meta' }), key: 'total' }));
		offset += page.length;
		const more = Number.isFinite(total) ? offset < total : page.length === PAGE_LIMIT;
		if (page.length === 0 || !more) {
			return { items, side, total: items.length };
		}
		if (items.length >= cap) {
			throw new Error(`ActiveCampaign returned more than ${cap} records from ${path}; stopped instead of returning a partial list. Narrow the request with a search or filter.`);
		}
	}
}

async function withDealOwnerHint<T>({ call, hint }: { call: () => Promise<T>; hint: string }): Promise<T> {
	try {
		return await call();
	} catch (error) {
		if (error instanceof ActiveCampaignApiError && error.status === 422 && DEAL_OWNER_REQUIRED.test(vendorMessage(error.responseBody))) {
			throw error.withHint(hint);
		}
		throw error;
	}
}

function webhookId(value: unknown): string {
	const id = acData.textAt({ value: acData.recordAt({ value, key: 'webhook' }), key: 'id' });
	if (id === undefined || id === '') {
		throw new Error('ActiveCampaign created the webhook but returned no webhook ID.');
	}
	return id;
}

function toCreateWebhookResponse(value: unknown): CreateWebhookResponse {
	const hook = acData.recordAt({ value, key: 'webhook' });
	const text = (key: string): string => acData.textAt({ value: hook, key }) ?? '';
	const list = (key: string): string[] => {
		const inner = hook?.[key];
		return Array.isArray(inner) ? inner.filter((item): item is string => typeof item === 'string') : [];
	};
	return {
		webhook: {
			id: webhookId(value),
			name: text('name'),
			url: text('url'),
			events: list('events'),
			sources: list('sources'),
			listid: text('listid'),
			cdate: text('cdate'),
			state: text('state'),
		},
	};
}

function toContactCustomFields({ items, side }: ListAllResult): ContactCustomFieldsResponse {
	return {
		fields: items.map((field) => ({
			id: acData.textAt({ value: field, key: 'id' }) ?? '',
			title: acData.textAt({ value: field, key: 'title' }) ?? '',
			type: customFieldType(acData.textAt({ value: field, key: 'type' })),
			perstag: acData.textAt({ value: field, key: 'perstag' }),
		})),
		fieldOptions: (side['fieldOptions'] ?? []).map((option) => ({
			id: acData.textAt({ value: option, key: 'id' }) ?? '',
			field: acData.textAt({ value: option, key: 'field' }) ?? '',
			value: acData.textAt({ value: option, key: 'value' }) ?? '',
			label: acData.textAt({ value: option, key: 'label' }) ?? '',
		})),
	};
}

function customFieldType(value: string | undefined): CUSTOM_FIELD_TYPE {
	const match = Object.values(CUSTOM_FIELD_TYPE).find((type) => type === value);
	return match ?? CUSTOM_FIELD_TYPE.TEXT;
}

export class ActiveCampaignApiError extends Error {
	readonly method: string;
	readonly path: string;
	readonly status: number;
	readonly responseBody: unknown;

	constructor({ method, path, status, responseBody, hint }: { method: string; path: string; status: number; responseBody: unknown; hint?: string }) {
		const wait = status === 429 ? ' Rate limit reached (5 requests per second per account); wait a few seconds and try again.' : '';
		super(`ActiveCampaign ${method} ${path} failed (${status}): ${vendorMessage(responseBody)}${wait}${hint === undefined ? '' : ` ${hint}`}`);
		this.name = 'ActiveCampaignApiError';
		this.method = method;
		this.path = path;
		this.status = status;
		this.responseBody = responseBody;
	}

	withHint(hint: string): ActiveCampaignApiError {
		return new ActiveCampaignApiError({ method: this.method, path: this.path, status: this.status, responseBody: this.responseBody, hint });
	}
}

export class ActiveCampaignNetworkError extends Error {
	readonly host: string;

	constructor({ host, reason }: { host: string; reason: string }) {
		super(`Could not reach ${host}: ${reason}. Check the API URL in the connection.`);
		this.name = 'ActiveCampaignNetworkError';
		this.host = host;
	}
}

export class ActiveCampaignConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ActiveCampaignConfigError';
	}
}

export class ActiveCampaignClient {
	private readonly auth: ClientAuth;

	constructor({ apiUrl, apiKey }: ClientAuth) {
		this.auth = { apiUrl, apiKey };
	}

	async request({ method, path, query, body }: Omit<RequestParams, 'apiUrl' | 'apiKey'>): Promise<ApiResponse> {
		return request({ ...this.auth, method, path, query, body });
	}

	async get({ path, query }: { path: string; query?: QueryParams }): Promise<unknown> {
		return (await this.request({ method: 'GET', path, query })).body;
	}

	async listPage({ path, key, query, limit, offset }: Omit<ListPageParams, 'auth'>): Promise<ListPage> {
		return listPage({ auth: this.auth, path, key, query, limit, offset });
	}

	async listAll({ path, key, query, cap, sideKeys }: Omit<ListAllParams, 'auth'>): Promise<ListAllResult> {
		return listAll({ auth: this.auth, path, key, query, cap, sideKeys });
	}

	async authenticate(): Promise<unknown> {
		return this.get({ path: '/users/me' });
	}

	async subscribeWebhook(webhook: CreateWebhookRequest): Promise<CreateWebhookResponse> {
		const response = await this.request({ method: 'POST', path: '/webhooks', body: { webhook } });
		return toCreateWebhookResponse(response.body);
	}

	async unsubscribeWebhook(webhookId: string): Promise<unknown> {
		return (await this.request({ method: 'DELETE', path: `/webhooks/${segment(webhookId)}` })).body;
	}

	async listContactLists({ search, limit = PAGE_LIMIT }: { search?: string; limit?: number } = {}): Promise<ListPage> {
		return this.listPage({ path: '/lists', key: 'lists', query: { 'filters[name]': search }, limit, offset: 0 });
	}

	async createAccount(account: CreateAccountRequest): Promise<unknown> {
		return (await this.request({ method: 'POST', path: '/accounts', body: { account } })).body;
	}

	async updateAccount({ accountId, account }: { accountId: string | number; account: Partial<CreateAccountRequest> }): Promise<unknown> {
		return (await this.request({ method: 'PUT', path: `/accounts/${segment(accountId)}`, body: { account } })).body;
	}

	async listAccounts({ search, limit = PAGE_LIMIT }: { search?: string; limit?: number } = {}): Promise<ListPage> {
		return this.listPage({ path: '/accounts', key: 'accounts', query: { search }, limit, offset: 0 });
	}

	async listAccountCustomFields(): Promise<ListAllResult> {
		return this.listAll({ path: '/accountCustomFieldMeta', key: 'accountCustomFieldMeta' });
	}

	async createContact(contact: CreateContactRequest): Promise<unknown> {
		return (await this.request({ method: 'POST', path: '/contacts', body: { contact } })).body;
	}

	async updateContact({ contactId, contact }: { contactId: string | number; contact: Partial<CreateContactRequest> }): Promise<unknown> {
		return (await this.request({ method: 'PUT', path: `/contacts/${segment(contactId)}`, body: { contact } })).body;
	}

	async listContacts({ search, limit = PAGE_LIMIT }: { search?: string; limit?: number } = {}): Promise<ListPage> {
		return this.listPage({ path: '/contacts', key: 'contacts', query: { search }, limit, offset: 0 });
	}

	async listContactCustomFields(): Promise<ContactCustomFieldsResponse> {
		return toContactCustomFields(await this.listAll({ path: '/fields', key: 'fields', sideKeys: ['fieldOptions'] }));
	}

	async addContactToList({ listId, contactId, status }: { listId: string; contactId: string; status: string }): Promise<ApiResponse> {
		return this.request({ method: 'POST', path: '/contactLists', body: { contactList: { list: listId, contact: contactId, status } } });
	}

	async createAccountContactAssociation({ contactId, accountId, jobTitle }: { contactId: string | number; accountId: string | number; jobTitle?: string }): Promise<ApiResponse> {
		return this.request({ method: 'POST', path: '/accountContacts', body: { accountContact: { contact: contactId, account: accountId, jobTitle } } });
	}

	async addTagToContact({ contactId, tagId }: { contactId: string; tagId: string }): Promise<ApiResponse> {
		return this.request({ method: 'POST', path: '/contactTags', body: { contactTag: { contact: contactId, tag: tagId } } });
	}

	async removeTagFromContact({ contactId, tagId }: { contactId: string; tagId: string }): Promise<{ removed: boolean; contactId: string; tagId: string }> {
		const associations = await this.listAll({ path: `/contacts/${segment(contactId)}/contactTags`, key: 'contactTags' });
		const ids = associations.items
			.filter((association) => acData.textAt({ value: association, key: 'tag' }) === tagId)
			.map((association) => acData.textAt({ value: association, key: 'id' }))
			.filter((id): id is string => id !== undefined);
		let removed = false;
		for (const id of ids) {
			if (await this.deleteIgnoringMissing({ path: `/contactTags/${segment(id)}` })) {
				removed = true;
			}
		}
		return { removed, contactId, tagId };
	}

	async deleteIgnoringMissing({ path }: { path: string }): Promise<boolean> {
		try {
			await this.request({ method: 'DELETE', path });
			return true;
		} catch (error) {
			if (error instanceof ActiveCampaignApiError && error.status === 404) {
				return false;
			}
			throw error;
		}
	}

	async listTags({ search, limit = PAGE_LIMIT }: { search?: string; limit?: number } = {}): Promise<ListPage> {
		return this.listPage({ path: '/tags', key: 'tags', query: { search }, limit, offset: 0 });
	}
}

export const activeCampaignApi = { request, listPage, listAll, normalizeApiUrl, verifiedTlsDispatcher, segment, vendorMessage, sleep, withDealOwnerHint, PAGE_LIMIT };

export type HttpVerb = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

export type ClientAuth = {
	apiUrl: string;
	apiKey: string;
};

export type RequestParams = ClientAuth & {
	method: HttpVerb;
	path: string;
	query?: QueryParams;
	body?: unknown;
};

type SendParams = {
	url: string;
	method: HttpVerb;
	headers: Record<string, string>;
	body: unknown;
	dispatcher: unknown;
	host: string;
};

export type ApiResponse = {
	status: number;
	body: unknown;
};

export type ListPageParams = {
	auth: ClientAuth;
	path: string;
	key: string;
	query?: QueryParams;
	limit: number;
	offset: number;
};

export type ListAllParams = {
	auth: ClientAuth;
	path: string;
	key: string;
	query?: QueryParams;
	cap?: number;
	sideKeys?: string[];
};

export type ListAllResult = {
	items: UnknownRecord[];
	side: Record<string, UnknownRecord[]>;
	total: number;
};
