import { HttpMethod, HttpResponse } from '@activepieces/pieces-common';

import { mauticClient } from './client';

import type {
	MauticAuthValue,
	MauticCompanySearchResult,
	MauticContactSearchResult,
	MauticEntityFieldType,
	MauticEntityInput,
	MauticField,
	MauticFieldList,
	MauticWebhookInformation,
} from './types';

async function listFields({
	auth,
	type,
}: {
	auth: MauticAuthValue;
	type: MauticEntityFieldType;
}): Promise<MauticField[]> {
	const response = await mauticClient.request<MauticFieldList>({
		auth,
		method: HttpMethod.GET,
		path: `fields/${type}?limit=1000`,
	});
	if (response.status !== 200) {
		throw Error(`Unable to fetch ${type} metadata`);
	}
	return Object.values(response.body.fields);
}

async function createContact({
	auth,
	fields,
}: {
	auth: MauticAuthValue;
	fields: MauticEntityInput;
}): Promise<HttpResponse> {
	return await mauticClient.request({
		auth,
		method: HttpMethod.POST,
		path: 'contacts/new',
		body: JSON.stringify(fields),
	});
}

async function updateContact({
	auth,
	id,
	fields,
}: {
	auth: MauticAuthValue;
	id: string;
	fields: MauticEntityInput;
}): Promise<HttpResponse> {
	return await mauticClient.request({
		auth,
		method: HttpMethod.PATCH,
		path: `contacts/${id}/edit`,
		body: JSON.stringify(fields),
	});
}

async function searchContacts({
	auth,
	fields,
}: {
	auth: MauticAuthValue;
	fields: MauticEntityInput;
}): Promise<MauticContactSearchResult> {
	let count = 0;
	let searchParams = '?';
	for (const key of Object.keys(fields)) {
		if (fields[key]) {
			searchParams += `where[${count}][col]=${key}&where[${count}][expr]=eq&where[${count}][val]=${fields[key]}&`;
			++count;
		}
	}
	return await searchEntity<MauticContactSearchResult>({ auth, path: `contacts${searchParams}` });
}

async function createCompany({
	auth,
	fields,
}: {
	auth: MauticAuthValue;
	fields: MauticEntityInput;
}): Promise<HttpResponse> {
	return await mauticClient.request({
		auth,
		method: HttpMethod.POST,
		path: 'companies/new',
		body: JSON.stringify(fields),
	});
}

async function updateCompany({
	auth,
	id,
	fields,
}: {
	auth: MauticAuthValue;
	id: string;
	fields: MauticEntityInput;
}): Promise<HttpResponse> {
	const nonEmptyFields = Object.fromEntries(Object.entries(fields).filter(([, value]) => value));
	return await mauticClient.request({
		auth,
		method: HttpMethod.PATCH,
		path: `companies/${id}/edit`,
		body: JSON.stringify(nonEmptyFields),
	});
}

async function searchCompanies({
	auth,
	fields,
}: {
	auth: MauticAuthValue;
	fields: MauticEntityInput;
}): Promise<MauticCompanySearchResult> {
	let searchParams = '?';
	for (const key of Object.keys(fields)) {
		if (fields[key]) {
			searchParams += `search=${key}:${fields[key]}&`;
		}
	}
	return await searchEntity<MauticCompanySearchResult>({ auth, path: `companies${searchParams}` });
}

async function createWebhook({
	auth,
	name,
	description,
	webhookUrl,
	eventType,
}: CreateWebhookParams): Promise<MauticWebhookInformation> {
	const response = await mauticClient.request<MauticWebhookInformation>({
		auth,
		method: HttpMethod.POST,
		path: 'hooks/new',
		body: {
			name,
			description,
			webhookUrl,
			eventsOrderbyDir: 'ASC',
			triggers: [eventType],
		},
	});
	return response.body;
}

async function deleteWebhook({
	auth,
	webhookId,
}: {
	auth: MauticAuthValue;
	webhookId: number;
}): Promise<void> {
	await mauticClient.request({
		auth,
		method: HttpMethod.DELETE,
		path: `hooks/${webhookId}/delete`,
	});
}

async function searchEntity<T extends { total?: number | string }>({
	auth,
	path,
}: {
	auth: MauticAuthValue;
	path: string;
}): Promise<T> {
	const response = await mauticClient.request<T>({ auth, method: HttpMethod.GET, path });
	const length = response.body.total;
	if (!length || length != 1) {
		throw Error('The query is not perfect enough to get single result. Please refine');
	}
	return response.body;
}

export const mauticApi = {
	listFields,
	createContact,
	updateContact,
	searchContacts,
	createCompany,
	updateCompany,
	searchCompanies,
	createWebhook,
	deleteWebhook,
};

type CreateWebhookParams = {
	auth: MauticAuthValue;
	name: string;
	description: string;
	webhookUrl: string;
	eventType: string;
};
