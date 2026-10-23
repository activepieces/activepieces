import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { twentyClient } from './client';

import type {
	TwentyAuthValue,
	TwentyDuplicateConnection,
	TwentyEnvelope,
	TwentyListResponse,
	TwentyMetadataItem,
	TwentyMetadataPage,
	TwentyMetadataSingle,
	TwentyPageInfo,
	TwentyPersonResponse,
	TwentyRecord,
	TwentyRecordList,
	TwentyRecordPage,
	TwentyResponse,
} from './types';

async function checkConnection({ auth }: { auth: TwentyAuthValue }): Promise<void> {
	await twentyClient.request<unknown>({
		auth,
		method: HttpMethod.GET,
		path: '/rest/people',
		query: { 'page[size]': '1' },
	});
}

async function createPerson({
	auth,
	firstName,
	lastName,
	email,
}: CreatePersonParams & { auth: TwentyAuthValue }): Promise<TwentyResponse> {
	return await twentyClient.request<TwentyResponse>({
		auth,
		method: HttpMethod.POST,
		path: '/rest/people',
		body: {
			name: {
				firstName,
				lastName,
			},
			emails: email ? { primaryEmail: email } : undefined,
		},
	});
}

async function createCompany({
	auth,
	name,
	domainName,
	address,
	employees,
}: CompanyFields & { auth: TwentyAuthValue; name: string }): Promise<TwentyResponse> {
	return await twentyClient.request<TwentyResponse>({
		auth,
		method: HttpMethod.POST,
		path: '/rest/companies',
		body: {
			name,
			domainName: domainName ? { primaryLinkUrl: domainName, primaryLinkLabel: '' } : undefined,
			address: address ? { addressStreet1: address } : undefined,
			employees: employees ?? undefined,
		},
	});
}

async function createOpportunity({
	auth,
	name,
	stage,
	amount,
	currency,
	closeDate,
	companyId,
}: CreateOpportunityParams & { auth: TwentyAuthValue }): Promise<TwentyResponse> {
	return await twentyClient.request<TwentyResponse>({
		auth,
		method: HttpMethod.POST,
		path: '/rest/opportunities',
		body: {
			name,
			stage: stage ?? undefined,
			amount:
				amount != null
					? { amountMicros: Math.round(amount * 1_000_000), currencyCode: currency ?? 'USD' }
					: undefined,
			closeDate: closeDate ?? undefined,
			companyId: companyId ?? undefined,
		},
	});
}

async function findCompanies({
	auth,
	name,
	domainName,
}: {
	auth: TwentyAuthValue;
	name?: string;
	domainName?: string;
}): Promise<TwentyRecord[]> {
	return await listRecordItems({
		auth,
		path: '/rest/companies',
		query: filterQuery({
			conditions: {
				name,
				'domainName.primaryLinkUrl': domainName
					? [...new Set([domainName, domainName.replace(/^https?:\/\//i, '')])]
					: undefined,
			},
		}),
	});
}

async function findPeople({
	auth,
	email,
	firstName,
	lastName,
}: {
	auth: TwentyAuthValue;
	email?: string;
	firstName?: string;
	lastName?: string;
}): Promise<TwentyRecord[]> {
	return await listRecordItems({
		auth,
		path: '/rest/people',
		query: filterQuery({
			conditions: {
				'emails.primaryEmail': email,
				'name.firstName': firstName,
				'name.lastName': lastName,
			},
		}),
	});
}

async function listRecentCompanies({ auth }: { auth: TwentyAuthValue }): Promise<TwentyRecord[]> {
	return await listRecordItems({ auth, path: '/rest/companies', query: RECENT_QUERY });
}

async function listRecentPeople({ auth }: { auth: TwentyAuthValue }): Promise<TwentyRecord[]> {
	return await listRecordItems({ auth, path: '/rest/people', query: RECENT_QUERY });
}

async function updateCompany({
	auth,
	companyId,
	name,
	domainName,
	address,
	employees,
}: CompanyFields & {
	auth: TwentyAuthValue;
	companyId: string;
	name?: string;
}): Promise<TwentyResponse> {
	const body: Record<string, unknown> = {};
	if (name) body['name'] = name;
	if (domainName) body['domainName'] = { primaryLinkUrl: domainName, primaryLinkLabel: '' };
	if (address) body['address'] = { addressStreet1: address };
	if (employees != null) body['employees'] = employees;

	if (Object.keys(body).length === 0) {
		return await twentyClient.request<TwentyResponse>({
			auth,
			method: HttpMethod.GET,
			path: `/rest/companies/${companyId}`,
		});
	}

	return await twentyClient.request<TwentyResponse>({
		auth,
		method: HttpMethod.PATCH,
		path: `/rest/companies/${companyId}`,
		body,
	});
}

async function updatePerson({
	auth,
	personId,
	firstName,
	lastName,
	email,
}: Partial<CreatePersonParams> & {
	auth: TwentyAuthValue;
	personId: string;
}): Promise<TwentyPersonResponse> {
	const body: Record<string, unknown> = {};
	if (firstName || lastName) {
		const existing = await getPerson({ auth, personId });
		const existingName = existing.data?.person?.name ?? {};
		body['name'] = {
			firstName: firstName ?? existingName.firstName,
			lastName: lastName ?? existingName.lastName,
		};
	}
	if (email) {
		body['emails'] = { primaryEmail: email };
	}

	if (Object.keys(body).length === 0) {
		return await getPerson({ auth, personId });
	}

	return await twentyClient.request<TwentyPersonResponse>({
		auth,
		method: HttpMethod.PATCH,
		path: `/rest/people/${personId}`,
		body,
	});
}

async function listRecords({
	auth,
	objectNamePlural,
	filter,
	orderBy,
	limit,
	depth,
	fields,
	startingAfter,
}: ListRecordsParams & { auth: TwentyAuthValue }): Promise<TwentyRecordList> {
	const response = await twentyClient.request<TwentyRecordPage>({
		auth,
		method: HttpMethod.GET,
		path: recordsPath({ objectNamePlural }),
		query: compactQuery({
			values: { filter, order_by: orderBy, limit, depth, fields, starting_after: startingAfter },
		}),
	});
	return {
		records: firstValue({ envelope: response }) ?? [],
		pageInfo: response.pageInfo,
		totalCount: response.totalCount,
	};
}

async function getRecord({
	auth,
	objectNamePlural,
	recordId,
	depth,
	fields,
}: RecordParams & { auth: TwentyAuthValue; depth?: number; fields?: string }): Promise<
	TwentyRecord | undefined
> {
	const response = await twentyClient.request<TwentyEnvelope<TwentyRecord>>({
		auth,
		method: HttpMethod.GET,
		path: recordsPath({ objectNamePlural, recordId }),
		query: compactQuery({ values: { depth, fields } }),
	});
	return firstValue({ envelope: response });
}

async function createRecord({
	auth,
	objectNamePlural,
	record,
	upsert,
}: {
	auth: TwentyAuthValue;
	objectNamePlural: string;
	record: Record<string, unknown>;
	upsert?: boolean;
}): Promise<TwentyRecord | undefined> {
	const response = await twentyClient.request<TwentyEnvelope<TwentyRecord>>({
		auth,
		method: HttpMethod.POST,
		path: recordsPath({ objectNamePlural }),
		query: compactQuery({ values: { upsert: upsert ? true : undefined } }),
		body: record,
	});
	return firstValue({ envelope: response });
}

async function createRecords({
	auth,
	objectNamePlural,
	records,
	upsert,
}: {
	auth: TwentyAuthValue;
	objectNamePlural: string;
	records: Record<string, unknown>[];
	upsert?: boolean;
}): Promise<{ records: TwentyRecord[]; count: number }> {
	const response = await twentyClient.request<TwentyEnvelope<TwentyRecord[]>>({
		auth,
		method: HttpMethod.POST,
		path: `/rest/batch/${encodeURIComponent(objectNamePlural)}`,
		query: compactQuery({ values: { upsert: upsert ? true : undefined } }),
		body: records,
	});
	const created = firstValue({ envelope: response }) ?? [];
	return { records: created, count: created.length };
}

async function updateRecord({
	auth,
	objectNamePlural,
	recordId,
	record,
}: RecordParams & { auth: TwentyAuthValue; record: Record<string, unknown> }): Promise<
	TwentyRecord | undefined
> {
	const response = await twentyClient.request<TwentyEnvelope<TwentyRecord>>({
		auth,
		method: HttpMethod.PATCH,
		path: recordsPath({ objectNamePlural, recordId }),
		body: record,
	});
	return firstValue({ envelope: response });
}

async function deleteRecord({
	auth,
	objectNamePlural,
	recordId,
	permanent,
}: RecordParams & { auth: TwentyAuthValue; permanent?: boolean }): Promise<
	TwentyRecord | undefined
> {
	const response = await twentyClient.request<TwentyEnvelope<TwentyRecord>>({
		auth,
		method: HttpMethod.DELETE,
		path: recordsPath({ objectNamePlural, recordId }),
		query: compactQuery({ values: { soft_delete: permanent ? undefined : true } }),
	});
	return firstValue({ envelope: response });
}

async function restoreRecord({
	auth,
	objectNamePlural,
	recordId,
}: RecordParams & { auth: TwentyAuthValue }): Promise<TwentyRecord | undefined> {
	const response = await twentyClient.request<TwentyEnvelope<TwentyRecord>>({
		auth,
		method: HttpMethod.PATCH,
		path: `${recordsPath({ objectNamePlural, recordId })}/restore`,
	});
	return firstValue({ envelope: response });
}

async function findDuplicateRecords({
	auth,
	objectNamePlural,
	recordIds,
	records,
}: {
	auth: TwentyAuthValue;
	objectNamePlural: string;
	recordIds?: string[];
	records?: Record<string, unknown>[];
}): Promise<{
	results: { duplicates: TwentyRecord[]; totalCount?: number; pageInfo?: TwentyPageInfo }[];
}> {
	const response = await twentyClient.request<{ data: TwentyDuplicateConnection[] }>({
		auth,
		method: HttpMethod.POST,
		path: `${recordsPath({ objectNamePlural })}/duplicates`,
		body: { ids: recordIds, data: records },
	});
	return {
		results: response.data.map((connection) => {
			const duplicates = Object.entries(connection).find(([key]) =>
				key.endsWith('Duplicates'),
			)?.[1];
			return {
				duplicates: Array.isArray(duplicates) ? duplicates : [],
				totalCount: connection.totalCount,
				pageInfo: connection.pageInfo,
			};
		}),
	};
}

async function mergeRecords({
	auth,
	objectNamePlural,
	recordIds,
	conflictPriorityIndex,
	dryRun,
}: {
	auth: TwentyAuthValue;
	objectNamePlural: string;
	recordIds: string[];
	conflictPriorityIndex: number;
	dryRun?: boolean;
}): Promise<TwentyRecord | undefined> {
	const response = await twentyClient.request<TwentyEnvelope<TwentyRecord>>({
		auth,
		method: HttpMethod.PATCH,
		path: `${recordsPath({ objectNamePlural })}/merge`,
		body: { ids: recordIds, conflictPriorityIndex, dryRun: dryRun ?? false },
	});
	return firstValue({ envelope: response });
}

async function groupRecords({
	auth,
	objectNamePlural,
	groupBy,
	aggregate,
	filter,
	orderBy,
	limit,
}: {
	auth: TwentyAuthValue;
	objectNamePlural: string;
	groupBy: Record<string, unknown>[];
	aggregate?: string[];
	filter?: string;
	orderBy?: string;
	limit?: number;
}): Promise<{ groups: Record<string, unknown>[]; count: number }> {
	const groups = await twentyClient.request<Record<string, unknown>[]>({
		auth,
		method: HttpMethod.GET,
		path: `${recordsPath({ objectNamePlural })}/groupBy`,
		query: compactQuery({
			values: {
				group_by: JSON.stringify(groupBy),
				aggregate: aggregate ? JSON.stringify(aggregate) : undefined,
				filter,
				order_by: orderBy,
				limit,
			},
		}),
	});
	return { groups, count: groups.length };
}

async function listObjects({
	auth,
	limit,
	startingAfter,
}: MetadataListParams & { auth: TwentyAuthValue }): Promise<
	MetadataList & { objects: TwentyMetadataItem[] }
> {
	const page = await listMetadata({ auth, resource: 'objects', limit, startingAfter });
	return { objects: page.items, pageInfo: page.pageInfo, totalCount: page.totalCount };
}

async function getObject({
	auth,
	objectId,
}: {
	auth: TwentyAuthValue;
	objectId: string;
}): Promise<TwentyMetadataItem> {
	const response = await twentyClient.request<TwentyMetadataSingle>({
		auth,
		method: HttpMethod.GET,
		path: `/rest/metadata/objects/${encodeURIComponent(objectId)}`,
	});
	return response.data?.object ?? response;
}

async function listFields({
	auth,
	limit,
	startingAfter,
}: MetadataListParams & { auth: TwentyAuthValue }): Promise<
	MetadataList & { fields: TwentyMetadataItem[] }
> {
	const page = await listMetadata({ auth, resource: 'fields', limit, startingAfter });
	return { fields: page.items, pageInfo: page.pageInfo, totalCount: page.totalCount };
}

async function getPerson({
	auth,
	personId,
}: {
	auth: TwentyAuthValue;
	personId: string;
}): Promise<TwentyPersonResponse> {
	return await twentyClient.request<TwentyPersonResponse>({
		auth,
		method: HttpMethod.GET,
		path: `/rest/people/${personId}`,
	});
}

async function listRecordItems({
	auth,
	path,
	query,
}: {
	auth: TwentyAuthValue;
	path: string;
	query: QueryParams;
}): Promise<TwentyRecord[]> {
	const response = await twentyClient.request<TwentyListResponse>({
		auth,
		method: HttpMethod.GET,
		path,
		query,
	});
	const items = response.data ?? response;
	if (Array.isArray(items)) return items;
	return Object.values(items).find(Array.isArray) ?? [];
}

async function listMetadata({
	auth,
	resource,
	limit,
	startingAfter,
}: MetadataListParams & { auth: TwentyAuthValue; resource: string }): Promise<
	MetadataList & { items: TwentyMetadataItem[] }
> {
	const response = await twentyClient.request<TwentyMetadataPage>({
		auth,
		method: HttpMethod.GET,
		path: `/rest/metadata/${resource}`,
		query: compactQuery({ values: { limit, starting_after: startingAfter } }),
	});
	const items = Array.isArray(response.data)
		? response.data
		: firstValue({ envelope: { data: response.data } }) ?? [];
	return { items, pageInfo: response.pageInfo, totalCount: response.totalCount };
}

function recordsPath({
	objectNamePlural,
	recordId,
}: {
	objectNamePlural: string;
	recordId?: string;
}): string {
	const base = `/rest/${encodeURIComponent(objectNamePlural)}`;
	return recordId ? `${base}/${encodeURIComponent(recordId)}` : base;
}

function filterQuery({
	conditions,
}: {
	conditions: Record<string, string | string[] | undefined>;
}): QueryParams {
	const filter = Object.entries(conditions)
		.filter(([, value]) => value)
		.map(
			([field, value]) =>
				`${field}[${Array.isArray(value) ? 'in' : 'eq'}]:${JSON.stringify(value)}`,
		)
		.join(',');
	return filter ? { filter } : {};
}

function firstValue<T>({ envelope }: { envelope: TwentyEnvelope<T> }): T | undefined {
	return Object.values(envelope.data)[0];
}

function compactQuery({
	values,
}: {
	values: Record<string, string | number | boolean | null | undefined>;
}): QueryParams {
	return Object.fromEntries(
		Object.entries(values)
			.filter(([, value]) => value !== undefined && value !== null && value !== '')
			.map(([key, value]) => [key, String(value)]),
	);
}

export const twentyApi = {
	checkConnection,
	createPerson,
	createCompany,
	createOpportunity,
	findCompanies,
	findPeople,
	listRecentCompanies,
	listRecentPeople,
	updateCompany,
	updatePerson,
	listRecords,
	getRecord,
	createRecord,
	createRecords,
	updateRecord,
	deleteRecord,
	restoreRecord,
	findDuplicateRecords,
	mergeRecords,
	groupRecords,
	listObjects,
	getObject,
	listFields,
};

const RECENT_QUERY: QueryParams = { order_by: 'createdAt[DescNullsLast]', limit: '100' };

type CreatePersonParams = { firstName: string; lastName?: string; email?: string };

type CompanyFields = { domainName?: string; address?: string; employees?: number };

type CreateOpportunityParams = {
	name: string;
	stage?: string;
	amount?: number;
	currency?: string;
	closeDate?: string;
	companyId?: string;
};

type RecordParams = { objectNamePlural: string; recordId: string };

type ListRecordsParams = {
	objectNamePlural: string;
	filter?: string;
	orderBy?: string;
	limit?: number;
	depth?: number;
	fields?: string;
	startingAfter?: string;
};

type MetadataListParams = { limit?: number; startingAfter?: string };

type MetadataList = { pageInfo?: TwentyPageInfo; totalCount?: number };
