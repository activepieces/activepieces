import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { twentyClient } from './client';

import type {
	TwentyAuthValue,
	TwentyListResponse,
	TwentyPersonResponse,
	TwentyRecord,
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
	const query: QueryParams = {};
	if (name) {
		query['filter[name][eq]'] = name;
	}
	if (domainName) {
		query['filter[domainName][primaryLinkUrl][eq]'] = domainName;
	}
	return await listRecords({ auth, path: '/rest/companies', query });
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
	const query: QueryParams = {};
	if (email) {
		query['filter[emails][primaryEmail][eq]'] = email;
	}
	if (firstName) {
		query['filter[name][firstName][eq]'] = firstName;
	}
	if (lastName) {
		query['filter[name][lastName][eq]'] = lastName;
	}
	return await listRecords({ auth, path: '/rest/people', query });
}

async function listRecentCompanies({ auth }: { auth: TwentyAuthValue }): Promise<TwentyRecord[]> {
	return await listRecords({ auth, path: '/rest/companies', query: RECENT_QUERY });
}

async function listRecentPeople({ auth }: { auth: TwentyAuthValue }): Promise<TwentyRecord[]> {
	return await listRecords({ auth, path: '/rest/people', query: RECENT_QUERY });
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
		const personData = existing.data ?? existing;
		const existingName = personData.name ?? {};
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

async function listRecords({
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
};

const RECENT_QUERY: QueryParams = { 'sort[createdAt]': 'desc', limit: '100' };

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
