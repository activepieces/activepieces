import { HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import {
	IntercomApiError,
	intercomRequest,
	IntercomAuthValue,
	isIntercomNotFound,
	isRecord,
	nextPageNumber,
	nextStartingAfter,
	resolveAdminId,
} from './client';

export async function findCompanyBy({
	auth,
	field,
	value,
}: {
	auth: IntercomAuthValue;
	field: 'name' | 'company_id';
	value: string;
}): Promise<IntercomRecord | undefined> {
	try {
		const body = await intercomRequest<unknown>({
			auth,
			method: HttpMethod.GET,
			path: ['companies'],
			query: { [field]: value, per_page: 1 },
			operation: 'find the company',
		});
		return firstCompany(body);
	} catch (error) {
		if (isIntercomNotFound({ error, codes: ['company_not_found', 'not_found'] })) {
			return undefined;
		}
		throw error;
	}
}

export async function searchContacts({
	auth,
	query,
	perPage,
	startingAfter,
}: {
	auth: IntercomAuthValue;
	query: SearchQuery;
	perPage: number;
	startingAfter?: string;
}): Promise<SearchPage> {
	return intercomRequest<SearchPage>({
		auth,
		method: HttpMethod.POST,
		path: ['contacts', 'search'],
		body: {
			query,
			pagination: { per_page: perPage, ...(startingAfter ? { starting_after: startingAfter } : {}) },
		},
		operation: 'search contacts',
	});
}

export async function resolveContact({
	auth,
	lookupBy,
	value,
}: {
	auth: IntercomAuthValue;
	lookupBy: 'id' | 'email' | 'external_id';
	value: string;
}): Promise<IntercomRecord> {
	const trimmed = value.trim();
	if (trimmed === '') {
		throw new Error('Provide the contact ID, email or external ID to look up.');
	}
	if (lookupBy === 'id') {
		return intercomRequest<IntercomRecord>({
			auth,
			method: HttpMethod.GET,
			path: ['contacts', trimmed],
			operation: 'get the contact',
		});
	}
	const page = await searchContacts({
		auth,
		query: { field: lookupBy, operator: '=', value: trimmed },
		perPage: 2,
	});
	const matches = page.data ?? [];
	if (matches.length === 0) {
		throw new Error(`No Intercom contact has ${lookupBy === 'email' ? 'the email' : 'the external ID'} ${trimmed}. Use Search Contacts to look it up by other fields.`);
	}
	if (matches.length > 1) {
		throw new Error(
			`More than one Intercom contact has ${lookupBy === 'email' ? 'the email' : 'the external ID'} ${trimmed}. Use Search Contacts and pass the contact ID instead.`,
		);
	}
	return matches[0];
}

export async function findTagByName({
	auth,
	name,
}: {
	auth: IntercomAuthValue;
	name: string;
}): Promise<IntercomRecord | undefined> {
	const body = await intercomRequest<{ data?: IntercomRecord[] }>({
		auth,
		method: HttpMethod.GET,
		path: ['tags'],
		operation: 'list tags',
	});
	const wanted = name.trim().toLowerCase();
	return (body.data ?? []).find((tag) => String(tag['name'] ?? '').toLowerCase() === wanted);
}

export async function findOrCreateTag({ auth, name }: { auth: IntercomAuthValue; name: string }): Promise<IntercomRecord> {
	const existing = await findTagByName({ auth, name });
	if (existing !== undefined) {
		return existing;
	}
	return intercomRequest<IntercomRecord>({
		auth,
		method: HttpMethod.POST,
		path: ['tags'],
		body: { name: name.trim() },
		operation: 'create the tag',
	});
}

export function toCursorList({ body, itemsKey }: { body: unknown; itemsKey: string }): CursorList {
	const record: IntercomRecord = isRecord(body) ? body : {};
	const rawItems = record[itemsKey];
	const items = Array.isArray(rawItems) ? rawItems : [];
	const next = nextStartingAfter(body);
	const total = Number(record['total_count']);
	return {
		items,
		total_count: Number.isFinite(total) ? total : items.length,
		has_more: next !== undefined,
		next_starting_after: next ?? null,
	};
}

export function toPagedList({ body, itemsKey }: { body: unknown; itemsKey: string }): PagedList {
	const record: IntercomRecord = isRecord(body) ? body : {};
	const rawItems = record[itemsKey];
	const items = Array.isArray(rawItems) ? rawItems : [];
	const next = nextPageNumber(body);
	const total = Number(record['total_count']);
	return {
		items,
		total_count: Number.isFinite(total) ? total : items.length,
		has_more: next !== undefined,
		next_page: next ?? null,
	};
}

export function buildSearchQuery({
	filters,
	advancedQuery,
	fallback,
}: {
	filters: SearchQuery[];
	advancedQuery: unknown;
	fallback: SearchQuery;
}): SearchQuery {
	const all = advancedQuery === undefined || advancedQuery === null ? filters : [...filters, toAdvancedQuery(advancedQuery)];
	if (all.length > MAX_FILTERS) {
		throw new Error(`Intercom allows at most ${MAX_FILTERS} filters in one search; ${all.length} were given.`);
	}
	if (all.length === 0) {
		return fallback;
	}
	return all.length === 1 ? all[0] : { operator: 'AND', value: all };
}

export function dateFilters({
	field,
	after,
	before,
}: {
	field: string;
	after: string | undefined;
	before: string | undefined;
}): SearchQuery[] {
	return [
		...(after ? [{ field, operator: '>', value: toUnixSeconds({ label: `${field} after`, value: after }) }] : []),
		...(before ? [{ field, operator: '<', value: toUnixSeconds({ label: `${field} before`, value: before }) }] : []),
	];
}

export function toUnixSeconds({ label, value }: { label: string; value: string }): number {
	const parsed = dayjs(value);
	if (!parsed.isValid()) {
		throw new Error(`${label} is not a valid date: ${value}`);
	}
	return parsed.unix();
}

export function clampPerPage(value: number | undefined): number {
	if (value === undefined || value === null) {
		return DEFAULT_PER_PAGE;
	}
	if (!Number.isInteger(value) || value < 1 || value > MAX_PER_PAGE) {
		throw new Error(`Results Per Page must be a whole number from 1 to ${MAX_PER_PAGE}.`);
	}
	return value;
}

export function flattenParts(conversationParts: unknown): FlatPart[] {
	if (!isRecord(conversationParts)) {
		return [];
	}
	const parts = conversationParts['conversation_parts'];
	if (!Array.isArray(parts)) {
		return [];
	}
	return parts.map((rawPart: unknown) => {
		const part: Record<string, unknown> = isRecord(rawPart) ? rawPart : {};
		const rawAuthor = part['author'];
		const author: Record<string, unknown> = isRecord(rawAuthor) ? rawAuthor : {};
		return {
			id: String(part['id'] ?? ''),
			part_type: typeof part['part_type'] === 'string' ? part['part_type'] : null,
			author_type: typeof author['type'] === 'string' ? author['type'] : null,
			author_id: author['id'] === undefined || author['id'] === null ? null : String(author['id']),
			author_name: typeof author['name'] === 'string' ? author['name'] : null,
			body: typeof part['body'] === 'string' ? part['body'] : null,
			created_at: typeof part['created_at'] === 'number' ? part['created_at'] : null,
		};
	});
}

export function attachmentUrlList(value: unknown): string[] | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}
	const list = Array.isArray(value) ? value : [value];
	const urls = list
		.map((item) => (typeof item === 'string' ? item.trim() : ''))
		.filter((item) => item.length > 0);
	if (urls.length === 0) {
		return undefined;
	}
	if (urls.length > MAX_ATTACHMENTS) {
		throw new Error(`Intercom accepts at most ${MAX_ATTACHMENTS} attachment URLs; ${urls.length} were given.`);
	}
	for (const url of urls) {
		if (!/^https?:\/\/\S+$/i.test(url)) {
			throw new Error(`Attachment URL must be a public http(s) link: ${url}`);
		}
	}
	return urls;
}

export function requireText({ label, value }: { label: string; value: string | undefined }): string {
	const trimmed = value?.trim() ?? '';
	if (trimmed === '') {
		throw new Error(`${label} is required.`);
	}
	return trimmed;
}

function toAdvancedQuery(value: unknown): SearchQuery {
	if (!isRecord(value)) {
		throw new Error('Advanced Query must be an Intercom search object such as {"field": "name", "operator": "~", "value": "Ann"}.');
	}
	if (!isSearchQuery(value)) {
		throw new Error('Advanced Query needs either field, operator and value, or operator AND/OR with a value list.');
	}
	return value;
}

function isSearchQuery(record: Record<string, unknown>): record is Record<string, unknown> & SearchQuery {
	const hasFilter = typeof record['field'] === 'string' && typeof record['operator'] === 'string' && 'value' in record;
	const hasGroup = (record['operator'] === 'AND' || record['operator'] === 'OR') && Array.isArray(record['value']);
	return hasFilter || hasGroup;
}

function firstCompany(body: unknown): IntercomRecord | undefined {
	if (!isRecord(body)) {
		return undefined;
	}
	const record: IntercomRecord = body;
	if (record['type'] === 'company') {
		return record;
	}
	const data = record['data'];
	if (Array.isArray(data) && data.length > 0) {
		return data[0];
	}
	return undefined;
}

const MAX_FILTERS = 15;
const MAX_ATTACHMENTS = 10;
const DEFAULT_PER_PAGE = 50;
const MAX_PER_PAGE = 150;

export type IntercomRecord = Record<string, unknown>;

export type CursorList = {
	items: IntercomRecord[];
	total_count: number;
	has_more: boolean;
	next_starting_after: string | null;
};

export type PagedList = {
	items: IntercomRecord[];
	total_count: number;
	has_more: boolean;
	next_page: number | null;
};

export type SearchQuery =
	| { field: string; operator: string; value: unknown }
	| { operator: 'AND' | 'OR'; value: SearchQuery[] };

export type SearchPage = {
	type?: string;
	data?: IntercomRecord[];
	total_count?: number;
	pages?: { next?: { starting_after?: string } | null; page?: number; per_page?: number; total_pages?: number };
};

export type FlatPart = {
	id: string;
	part_type: string | null;
	author_type: string | null;
	author_id: string | null;
	author_name: string | null;
	body: string | null;
	created_at: number | null;
};

export async function setRecordTag({
	auth,
	target,
	recordId,
	tagId,
	tagName,
	remove,
}: {
	auth: IntercomAuthValue;
	target: TagTarget;
	recordId: string;
	tagId: string | undefined;
	tagName: string | undefined;
	remove: boolean;
}) {
	const tag = remove
		? await findExistingTag({ auth, tagId, tagName })
		: await getOrCreateTag({ auth, tagId, tagName });
	if (tag === undefined) {
		return {
			target,
			record_id: recordId,
			tag: { id: tagId ?? null, name: tagName ?? null },
			removed: true,
			already_in_state: true,
		};
	}

	if (target === 'company') {
		await tagCompany({ auth, recordId, tag, remove });
		return { target, record_id: recordId, tag, removed: remove, already_in_state: false };
	}

	const plural = PLURAL[target];
	const adminId = target === 'contact' ? undefined : await resolveAdminId({ auth, adminId: undefined });
	if (!remove) {
		await intercomRequest({
			auth,
			method: HttpMethod.POST,
			path: [plural, recordId, 'tags'],
			body: { id: tag.id, ...(adminId ? { admin_id: adminId } : {}) },
			operation: `tag the ${target}`,
		});
		return { target, record_id: recordId, tag, removed: false, already_in_state: false };
	}

	try {
		await intercomRequest({
			auth,
			method: HttpMethod.DELETE,
			path: [plural, recordId, 'tags', tag.id],
			body: adminId ? { admin_id: adminId } : undefined,
			operation: `untag the ${target}`,
		});
		return { target, record_id: recordId, tag, removed: true, already_in_state: false };
	} catch (error) {
		if (error instanceof IntercomApiError && error.status === 404) {
			await intercomRequest({
				auth,
				method: HttpMethod.GET,
				path: [plural, recordId],
				operation: `get the ${target}`,
			});
			return { target, record_id: recordId, tag, removed: true, already_in_state: true };
		}
		throw error;
	}
}

async function getOrCreateTag({
	auth,
	tagId,
	tagName,
}: {
	auth: IntercomAuthValue;
	tagId: string | undefined;
	tagName: string | undefined;
}): Promise<TagRef> {
	if (tagId !== undefined) {
		return toTagRef(
			await intercomRequest<Record<string, unknown>>({
				auth,
				method: HttpMethod.GET,
				path: ['tags', tagId],
				operation: 'get the tag',
			}),
		);
	}
	return toTagRef(await findOrCreateTag({ auth, name: tagName ?? '' }));
}

async function findExistingTag({
	auth,
	tagId,
	tagName,
}: {
	auth: IntercomAuthValue;
	tagId: string | undefined;
	tagName: string | undefined;
}): Promise<TagRef | undefined> {
	const body = await intercomRequest<{ data?: Array<Record<string, unknown>> }>({
		auth,
		method: HttpMethod.GET,
		path: ['tags'],
		operation: 'list tags',
	});
	const wanted = tagName?.toLowerCase();
	const match = (body.data ?? []).find((tag) =>
		tagId !== undefined ? String(tag['id']) === tagId : String(tag['name'] ?? '').toLowerCase() === wanted,
	);
	return match === undefined ? undefined : toTagRef(match);
}

async function tagCompany({
	auth,
	recordId,
	tag,
	remove,
}: {
	auth: IntercomAuthValue;
	recordId: string;
	tag: TagRef;
	remove: boolean;
}): Promise<void> {
	if (!remove) {
		await intercomRequest({
			auth,
			method: HttpMethod.POST,
			path: ['tags'],
			body: { name: tag.name, companies: [{ id: recordId }] },
			operation: 'tag the company',
		});
		return;
	}
	const company = await intercomRequest<{ company_id?: string }>({
		auth,
		method: HttpMethod.GET,
		path: ['companies', recordId],
		operation: 'get the company',
	});
	await intercomRequest({
		auth,
		method: HttpMethod.POST,
		path: ['tags'],
		body: { name: tag.name, companies: [{ id: recordId, company_id: company.company_id, untag: true }] },
		operation: 'untag the company',
	});
}

function toTagRef(tag: Record<string, unknown>): TagRef {
	return { id: String(tag['id']), name: String(tag['name'] ?? '') };
}

const PLURAL: Record<Exclude<TagTarget, 'company'>, string> = {
	contact: 'contacts',
	conversation: 'conversations',
	ticket: 'tickets',
};

export type TagTarget = 'contact' | 'conversation' | 'company' | 'ticket';

type TagRef = { id: string; name: string };

export async function searchRecords({
	auth,
	resource,
	query,
	perPage,
	startingAfter,
}: {
	auth: IntercomAuthValue;
	resource: 'contacts' | 'conversations' | 'tickets';
	query: SearchQuery;
	perPage: number | undefined;
	startingAfter: string | undefined;
}): Promise<CursorList> {
	const cursor = startingAfter?.trim();
	const body = await intercomRequest<unknown>({
		auth,
		method: HttpMethod.POST,
		path: [resource, 'search'],
		body: {
			query,
			pagination: { per_page: clampPerPage(perPage), ...(cursor ? { starting_after: cursor } : {}) },
		},
		operation: `search ${resource}`,
	});
	return toCursorList({ body, itemsKey: SEARCH_ITEMS_KEY[resource] });
}

const SEARCH_ITEMS_KEY: Record<'contacts' | 'conversations' | 'tickets', string> = {
	contacts: 'data',
	conversations: 'conversations',
	tickets: 'tickets',
};

export async function listCompanies({
	auth,
	tagId,
	segmentId,
	page,
	perPage,
}: {
	auth: IntercomAuthValue;
	tagId: string | undefined;
	segmentId: string | undefined;
	page: number | undefined;
	perPage: number | undefined;
}): Promise<PagedList> {
	const pageSize = clampPerPage(perPage);
	const body =
		tagId || segmentId
			? await intercomRequest<unknown>({
					auth,
					method: HttpMethod.GET,
					path: ['companies'],
					query: { tag_id: tagId, segment_id: segmentId, page, per_page: pageSize },
					operation: 'list companies',
			  })
			: await intercomRequest<unknown>({
					auth,
					method: HttpMethod.POST,
					path: ['companies', 'list'],
					query: { page, per_page: pageSize, order: 'desc' },
					operation: 'list companies',
			  });
	return toPagedList({ body, itemsKey: 'data' });
}
