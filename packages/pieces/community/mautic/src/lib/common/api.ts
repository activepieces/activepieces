import FormData from 'form-data';

import { HttpMethod, HttpResponse } from '@activepieces/pieces-common';
import { isNil, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticClient } from './client';

import type {
	MauticActivityQuery,
	MauticAuthValue,
	MauticCompanySearchResult,
	MauticContactSearchResult,
	MauticEntityFieldType,
	MauticEntityInput,
	MauticField,
	MauticFieldList,
	MauticListQuery,
	MauticRecord,
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

async function getCurrentUser({ auth }: { auth: MauticAuthValue }): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.GET,
		path: 'users/self',
	});
	return response.body;
}

async function listRecords({
	auth,
	resource,
	key,
	query,
}: {
	auth: MauticAuthValue;
	resource: string;
	key: string;
	query: MauticListQuery;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.GET,
		path: resource,
		queryParams: listQuery(query),
	});
	return { ...response.body, [key]: valuesOf({ value: response.body[key] }) };
}

async function getRecord({ auth, resource, id }: RecordParams): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.GET,
		path: `${resource}/${id}`,
	});
	return response.body;
}

async function createRecord({
	auth,
	resource,
	body,
}: {
	auth: MauticAuthValue;
	resource: string;
	body: MauticRecord;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.POST,
		path: `${resource}/new`,
		body,
	});
	return response.body;
}

async function updateRecord({
	auth,
	resource,
	id,
	body,
}: RecordParams & { body: MauticRecord }): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.PATCH,
		path: `${resource}/${id}/edit`,
		body,
	});
	return response.body;
}

async function deleteRecord({ auth, resource, id }: RecordParams): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.DELETE,
		path: `${resource}/${id}/delete`,
	});
	return response.body;
}

async function batchCreateRecords({
	auth,
	resource,
	records,
}: {
	auth: MauticAuthValue;
	resource: string;
	records: MauticRecord[];
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.POST,
		path: `${resource}/batch/new`,
		body: records,
	});
	return response.body;
}

async function batchUpdateRecords({
	auth,
	resource,
	records,
}: {
	auth: MauticAuthValue;
	resource: string;
	records: MauticRecord[];
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.PATCH,
		path: `${resource}/batch/edit`,
		body: records,
	});
	return response.body;
}

async function batchDeleteRecords({
	auth,
	resource,
	ids,
}: {
	auth: MauticAuthValue;
	resource: string;
	ids: string[];
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.DELETE,
		path: `${resource}/batch/delete`,
		queryParams: { ids: ids.join(',') },
	});
	return response.body;
}

async function listActivity({
	auth,
	contactId,
	query,
}: {
	auth: MauticAuthValue;
	contactId?: string;
	query: MauticActivityQuery;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.GET,
		path: contactId ? `contacts/${contactId}/activity` : 'contacts/activity',
		queryParams: activityQuery(query),
	});
	return response.body;
}

async function listContactOptions({
	auth,
	list,
	query,
}: {
	auth: MauticAuthValue;
	list: 'fields' | 'owners' | 'segments';
	query?: Record<string, string>;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<unknown>({
		auth,
		method: HttpMethod.GET,
		path: `contacts/list/${list}`,
		queryParams: query,
	});
	return { [list]: response.body };
}

async function listContactRelation({
	auth,
	id,
	relation,
	query,
}: {
	auth: MauticAuthValue;
	id: string;
	relation: 'campaigns' | 'companies' | 'notes' | 'segments' | 'devices';
	query?: MauticListQuery;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.GET,
		path: `contacts/${id}/${relation}`,
		queryParams: query ? listQuery(query) : undefined,
	});
	const key = relation === 'segments' ? 'lists' : relation;
	return { ...response.body, [key]: valuesOf({ value: response.body[key] }) };
}

async function setDoNotContact({
	auth,
	id,
	channel,
	change,
	body,
}: {
	auth: MauticAuthValue;
	id: string;
	channel: string;
	change: 'add' | 'remove';
	body?: MauticRecord;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.POST,
		path: `contacts/${id}/dnc/${channel}/${change}`,
		body,
	});
	return response.body;
}

async function addContactUtmTags({
	auth,
	id,
	body,
}: {
	auth: MauticAuthValue;
	id: string;
	body: MauticRecord;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.POST,
		path: `contacts/${id}/utm/add`,
		body,
	});
	return response.body;
}

async function removeContactUtmTags({
	auth,
	id,
	utmId,
}: {
	auth: MauticAuthValue;
	id: string;
	utmId: string;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.POST,
		path: `contacts/${id}/utm/${utmId}/remove`,
	});
	return response.body;
}

async function adjustContactPoints({
	auth,
	id,
	operator,
	delta,
	body,
}: {
	auth: MauticAuthValue;
	id: string;
	operator: string;
	delta: number;
	body: MauticRecord;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.POST,
		path: `contacts/${id}/points/${operator}/${delta}`,
		body,
	});
	return response.body;
}

async function listContactPointGroups({
	auth,
	id,
}: {
	auth: MauticAuthValue;
	id: string;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.GET,
		path: `contacts/${id}/points/groups`,
	});
	return response.body;
}

async function getContactPointGroup({
	auth,
	id,
	groupId,
}: {
	auth: MauticAuthValue;
	id: string;
	groupId: string;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.GET,
		path: `contacts/${id}/points/groups/${groupId}`,
	});
	return response.body;
}

async function adjustContactGroupPoints({
	auth,
	id,
	groupId,
	operator,
	value,
	body,
}: {
	auth: MauticAuthValue;
	id: string;
	groupId: string;
	operator: string;
	value: number;
	body: MauticRecord;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.POST,
		path: `contacts/${id}/points/groups/${groupId}/${operator}/${value}`,
		body,
	});
	return response.body;
}

async function changeMembership({
	auth,
	resource,
	id,
	contactId,
	change,
}: RecordParams & { contactId: string; change: 'add' | 'remove' }): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.POST,
		path: `${resource}/${id}/contact/${contactId}/${change}`,
	});
	return response.body;
}

async function addContactsToSegment({
	auth,
	id,
	contactIds,
}: {
	auth: MauticAuthValue;
	id: string;
	contactIds: string[];
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.POST,
		path: `segments/${id}/contacts/add`,
		body: { ids: contactIds },
	});
	return response.body;
}

async function cloneCampaign({
	auth,
	id,
}: {
	auth: MauticAuthValue;
	id: string;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.POST,
		path: `campaigns/clone/${id}`,
	});
	return response.body;
}

async function listCampaignContacts({
	auth,
	id,
	query,
}: {
	auth: MauticAuthValue;
	id: string;
	query: MauticListQuery;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.GET,
		path: `campaigns/${id}/contacts`,
		queryParams: listQuery(query),
	});
	return response.body;
}

async function listContactCampaignEvents({
	auth,
	contactId,
	campaignId,
	query,
}: {
	auth: MauticAuthValue;
	contactId: string;
	campaignId?: string;
	query: MauticListQuery;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.GET,
		path: campaignId
			? `campaigns/${campaignId}/events/contact/${contactId}`
			: `campaigns/events/contact/${contactId}`,
		queryParams: listQuery(query),
	});
	return { ...response.body, events: valuesOf({ value: response.body['events'] }) };
}

async function rescheduleContactCampaignEvent({
	auth,
	eventId,
	contactId,
	body,
}: {
	auth: MauticAuthValue;
	eventId: string;
	contactId: string;
	body: MauticRecord;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.PUT,
		path: `campaigns/events/${eventId}/contact/${contactId}/edit`,
		body,
	});
	return response.body;
}

async function batchRescheduleContactCampaignEvents({
	auth,
	records,
}: {
	auth: MauticAuthValue;
	records: MauticRecord[];
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.PUT,
		path: 'campaigns/events/batch/edit',
		body: records,
	});
	return response.body;
}

async function listFormSubmissions({
	auth,
	formId,
	contactId,
	query,
}: {
	auth: MauticAuthValue;
	formId: string;
	contactId?: string;
	query: MauticListQuery;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.GET,
		path: contactId
			? `forms/${formId}/submissions/contact/${contactId}`
			: `forms/${formId}/submissions`,
		queryParams: listQuery(query),
	});
	return { ...response.body, submissions: valuesOf({ value: response.body['submissions'] }) };
}

async function getFormSubmission({
	auth,
	formId,
	submissionId,
}: {
	auth: MauticAuthValue;
	formId: string;
	submissionId: string;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.GET,
		path: `forms/${formId}/submissions/${submissionId}`,
	});
	return response.body;
}

async function deleteFormItems({
	auth,
	formId,
	kind,
	ids,
}: {
	auth: MauticAuthValue;
	formId: string;
	kind: 'fields' | 'actions';
	ids: string[];
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.DELETE,
		path: `forms/${formId}/${kind}/delete`,
		queryParams: Object.fromEntries(ids.map((id, index) => [`${kind}[${index}]`, id])),
	});
	return response.body;
}

async function listAssignableRoles({ auth }: { auth: MauticAuthValue }): Promise<MauticRecord> {
	const response = await mauticClient.request<unknown>({
		auth,
		method: HttpMethod.GET,
		path: 'users/list/roles',
	});
	return { roles: response.body };
}

async function checkUserPermissions({
	auth,
	id,
	permissions,
}: {
	auth: MauticAuthValue;
	id: string;
	permissions: string[];
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.POST,
		path: `users/${id}/permissioncheck`,
		body: { permissions },
	});
	return response.body;
}

async function getReport({
	auth,
	id,
	query,
}: {
	auth: MauticAuthValue;
	id: string;
	query: Record<string, string>;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.GET,
		path: `reports/${id}`,
		queryParams: query,
	});
	return response.body;
}

async function getStats({
	auth,
	table,
	query,
}: {
	auth: MauticAuthValue;
	table?: string;
	query: MauticListQuery;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.GET,
		path: table ? `stats/${table}` : 'stats',
		queryParams: listQuery(query),
	});
	return response.body;
}

async function getDashboardData({
	auth,
	type,
	query,
}: {
	auth: MauticAuthValue;
	type?: string;
	query?: Record<string, string>;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.GET,
		path: type ? `data/${type}` : 'data',
		queryParams: query,
	});
	return response.body;
}

async function generateFocusItemJs({
	auth,
	id,
}: {
	auth: MauticAuthValue;
	id: string;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.POST,
		path: `focus/${id}/js`,
	});
	return response.body;
}

async function listPointTypes({
	auth,
	kind,
}: {
	auth: MauticAuthValue;
	kind: 'actions' | 'triggers/events';
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.GET,
		path: `points/${kind}/types`,
	});
	return response.body;
}

async function deletePointTriggerEvents({
	auth,
	triggerId,
	eventIds,
}: {
	auth: MauticAuthValue;
	triggerId: string;
	eventIds: string[];
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.DELETE,
		path: `points/triggers/${triggerId}/events/delete`,
		queryParams: Object.fromEntries(eventIds.map((id, index) => [`events[${index}]`, id])),
	});
	return response.body;
}

async function listFiles({
	auth,
	dir,
	subdir,
}: {
	auth: MauticAuthValue;
	dir: string;
	subdir?: string;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.GET,
		path: `files/${dir}`,
		queryParams: subdir ? { subdir } : undefined,
	});
	return response.body;
}

async function uploadFile({
	auth,
	path,
	file,
	subdir,
}: {
	auth: MauticAuthValue;
	path: string;
	file: { filename: string; data: Buffer };
	subdir?: string;
}): Promise<MauticRecord> {
	const form = new FormData();
	form.append('file', file.data, file.filename);
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.POST,
		path,
		body: form,
		headers: form.getHeaders(),
		queryParams: subdir ? { subdir } : undefined,
	});
	return response.body;
}

async function deleteFile({
	auth,
	dir,
	file,
	subdir,
}: {
	auth: MauticAuthValue;
	dir: string;
	file: string;
	subdir?: string;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.DELETE,
		path: `files/${dir}/${file}/delete`,
		queryParams: subdir ? { subdir } : undefined,
	});
	return response.body;
}

async function listThemes({ auth }: { auth: MauticAuthValue }): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.GET,
		path: 'themes',
	});
	return response.body;
}

async function getTheme({
	auth,
	theme,
}: {
	auth: MauticAuthValue;
	theme: string;
}): Promise<Buffer> {
	const response = await mauticClient.request<Buffer>({
		auth,
		method: HttpMethod.GET,
		path: `themes/${theme}`,
		responseType: 'arraybuffer',
	});
	return response.body;
}

async function deleteTheme({
	auth,
	theme,
}: {
	auth: MauticAuthValue;
	theme: string;
}): Promise<MauticRecord> {
	const response = await mauticClient.request<MauticRecord>({
		auth,
		method: HttpMethod.DELETE,
		path: `themes/${theme}/delete`,
	});
	return response.body;
}

function listQuery({
	search,
	start,
	limit,
	orderBy,
	orderByDir,
	publishedOnly,
	where,
}: MauticListQuery): Record<string, string> {
	return {
		...spreadIfDefined('search', search),
		...spreadIfDefined('start', start?.toString()),
		...spreadIfDefined('limit', limit?.toString()),
		...spreadIfDefined('orderBy', orderBy),
		...spreadIfDefined('orderByDir', orderByDir),
		...(publishedOnly ? { published: '1' } : {}),
		...Object.fromEntries(
			(where ?? []).flatMap((condition, index) =>
				Object.entries(recordOf({ value: condition }))
					.filter(([, value]) => !isNil(value) && value !== '')
					.map(([field, value]) => [`where[${index}][${field}]`, String(value)]),
			),
		),
	};
}

function activityQuery({
	search,
	includeEvents,
	excludeEvents,
	dateFrom,
	dateTo,
	orderBy,
	orderByDir,
	page,
	limit,
}: MauticActivityQuery): Record<string, string> {
	return {
		...spreadIfDefined('filters[search]', search),
		...Object.fromEntries(
			(includeEvents ?? []).map((event, index) => [
				`filters[includeEvents][${index}]`,
				String(event),
			]),
		),
		...Object.fromEntries(
			(excludeEvents ?? []).map((event, index) => [
				`filters[excludeEvents][${index}]`,
				String(event),
			]),
		),
		...spreadIfDefined('filters[dateFrom]', dateFrom),
		...spreadIfDefined('filters[dateTo]', dateTo),
		...spreadIfDefined('order[0]', orderBy),
		...spreadIfDefined('order[1]', orderBy ? orderByDir : undefined),
		...spreadIfDefined('page', page?.toString()),
		...spreadIfDefined('limit', limit?.toString()),
	};
}

function valuesOf({ value }: { value: unknown }): unknown {
	return typeof value === 'object' && value !== null ? Object.values(value) : value;
}

function recordOf({ value }: { value: unknown }): object {
	return typeof value === 'object' && value !== null ? value : {};
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
	getCurrentUser,
	listRecords,
	getRecord,
	createRecord,
	updateRecord,
	deleteRecord,
	batchCreateRecords,
	batchUpdateRecords,
	batchDeleteRecords,
	listActivity,
	listContactOptions,
	listContactRelation,
	setDoNotContact,
	addContactUtmTags,
	removeContactUtmTags,
	adjustContactPoints,
	listContactPointGroups,
	getContactPointGroup,
	adjustContactGroupPoints,
	changeMembership,
	addContactsToSegment,
	cloneCampaign,
	listCampaignContacts,
	listContactCampaignEvents,
	rescheduleContactCampaignEvent,
	batchRescheduleContactCampaignEvents,
	listFormSubmissions,
	getFormSubmission,
	deleteFormItems,
	listAssignableRoles,
	checkUserPermissions,
	getReport,
	getStats,
	getDashboardData,
	generateFocusItemJs,
	listPointTypes,
	deletePointTriggerEvents,
	listFiles,
	uploadFile,
	deleteFile,
	listThemes,
	getTheme,
	deleteTheme,
};

type RecordParams = { auth: MauticAuthValue; resource: string; id: string };

type CreateWebhookParams = {
	auth: MauticAuthValue;
	name: string;
	description: string;
	webhookUrl: string;
	eventType: string;
};
