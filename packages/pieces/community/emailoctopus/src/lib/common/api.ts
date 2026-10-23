import { createHash } from 'crypto';

import { HttpError, HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { emailOctopusClient } from './client';

import type {
	EmailOctopusAuthValue,
	EmailOctopusCampaign,
	EmailOctopusCampaignLinksReport,
	EmailOctopusCampaignReport,
	EmailOctopusCampaignSummaryReport,
	EmailOctopusContact,
	EmailOctopusContactBatchItem,
	EmailOctopusContactBatchResult,
	EmailOctopusContactCreate,
	EmailOctopusContactUpdate,
	EmailOctopusFieldInput,
	EmailOctopusList,
	EmailOctopusListDetails,
	EmailOctopusListField,
	EmailOctopusPage,
	EmailOctopusTag,
} from './types';

async function listLists({ auth }: { auth: EmailOctopusAuthValue }): Promise<EmailOctopusList[]> {
	const response = await emailOctopusClient.request<{
		data: EmailOctopusList[];
	}>({ auth, method: HttpMethod.GET, path: '/lists' });
	return response.data;
}

async function listListsPage({
	auth,
	...page
}: PageParams & { auth: EmailOctopusAuthValue }): Promise<
	EmailOctopusPage<EmailOctopusListDetails>
> {
	return await emailOctopusClient.request<EmailOctopusPage<EmailOctopusListDetails>>({
		auth,
		method: HttpMethod.GET,
		path: '/lists',
		query: pageQuery(page),
	});
}

async function getList({
	auth,
	listId,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
}): Promise<EmailOctopusListDetails> {
	return await emailOctopusClient.request<EmailOctopusListDetails>({
		auth,
		method: HttpMethod.GET,
		path: `/lists/${listId}`,
	});
}

async function createList({
	auth,
	name,
}: {
	auth: EmailOctopusAuthValue;
	name: string;
}): Promise<EmailOctopusList> {
	return await emailOctopusClient.request<EmailOctopusList>({
		auth,
		method: HttpMethod.POST,
		path: '/lists',
		body: { name },
	});
}

async function updateList({
	auth,
	listId,
	name,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
	name: string;
}): Promise<EmailOctopusListDetails> {
	return await emailOctopusClient.request<EmailOctopusListDetails>({
		auth,
		method: HttpMethod.PUT,
		path: `/lists/${listId}`,
		body: { name },
	});
}

async function deleteList({
	auth,
	listId,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
}): Promise<void> {
	await emailOctopusClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/lists/${listId}`,
	});
}

async function createField({
	auth,
	listId,
	field,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
	field: EmailOctopusFieldInput;
}): Promise<EmailOctopusListField> {
	return await emailOctopusClient.request<EmailOctopusListField>({
		auth,
		method: HttpMethod.POST,
		path: `/lists/${listId}/fields`,
		body: field,
	});
}

async function updateField({
	auth,
	listId,
	tag,
	field,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
	tag: string;
	field: EmailOctopusFieldInput;
}): Promise<EmailOctopusListField> {
	return await emailOctopusClient.request<EmailOctopusListField>({
		auth,
		method: HttpMethod.PUT,
		path: `/lists/${listId}/fields/${encodeURIComponent(tag)}`,
		body: field,
	});
}

async function deleteField({
	auth,
	listId,
	tag,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
	tag: string;
}): Promise<void> {
	await emailOctopusClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/lists/${listId}/fields/${encodeURIComponent(tag)}`,
	});
}

async function listTags({
	auth,
	listId,
	...page
}: PageParams & {
	auth: EmailOctopusAuthValue;
	listId: string;
}): Promise<EmailOctopusPage<EmailOctopusTag>> {
	return await emailOctopusClient.request<EmailOctopusPage<EmailOctopusTag>>({
		auth,
		method: HttpMethod.GET,
		path: `/lists/${listId}/tags`,
		query: pageQuery(page),
	});
}

async function createTag({
	auth,
	listId,
	tag,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
	tag: string;
}): Promise<EmailOctopusTag> {
	return await emailOctopusClient.request<EmailOctopusTag>({
		auth,
		method: HttpMethod.POST,
		path: `/lists/${listId}/tags`,
		body: { tag },
	});
}

async function updateTag({
	auth,
	listId,
	tag,
	newTag,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
	tag: string;
	newTag: string;
}): Promise<EmailOctopusTag> {
	return await emailOctopusClient.request<EmailOctopusTag>({
		auth,
		method: HttpMethod.PUT,
		path: `/lists/${listId}/tags/${encodeURIComponent(tag)}`,
		body: { tag: newTag },
	});
}

async function deleteTag({
	auth,
	listId,
	tag,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
	tag: string;
}): Promise<void> {
	await emailOctopusClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/lists/${listId}/tags/${encodeURIComponent(tag)}`,
	});
}

async function listCampaigns({
	auth,
}: {
	auth: EmailOctopusAuthValue;
}): Promise<EmailOctopusCampaign[]> {
	const response = await emailOctopusClient.request<{
		data: EmailOctopusCampaign[];
	}>({ auth, method: HttpMethod.GET, path: '/campaigns' });
	return response.data;
}

async function listCampaignsPage({
	auth,
	...page
}: PageParams & { auth: EmailOctopusAuthValue }): Promise<EmailOctopusPage<EmailOctopusCampaign>> {
	return await emailOctopusClient.request<EmailOctopusPage<EmailOctopusCampaign>>({
		auth,
		method: HttpMethod.GET,
		path: '/campaigns',
		query: pageQuery(page),
	});
}

async function getCampaign({
	auth,
	campaignId,
}: {
	auth: EmailOctopusAuthValue;
	campaignId: string;
}): Promise<EmailOctopusCampaign> {
	return await emailOctopusClient.request<EmailOctopusCampaign>({
		auth,
		method: HttpMethod.GET,
		path: `/campaigns/${campaignId}`,
	});
}

async function getCampaignContactReport({
	auth,
	campaignId,
	status,
	...page
}: PageParams & {
	auth: EmailOctopusAuthValue;
	campaignId: string;
	status: string;
}): Promise<EmailOctopusCampaignReport> {
	return await emailOctopusClient.request<EmailOctopusCampaignReport>({
		auth,
		method: HttpMethod.GET,
		path: `/campaigns/${campaignId}/reports`,
		query: { ...pageQuery(page), status },
	});
}

async function getCampaignLinksReport({
	auth,
	campaignId,
}: {
	auth: EmailOctopusAuthValue;
	campaignId: string;
}): Promise<EmailOctopusCampaignLinksReport> {
	return await emailOctopusClient.request<EmailOctopusCampaignLinksReport>({
		auth,
		method: HttpMethod.GET,
		path: `/campaigns/${campaignId}/reports/links`,
	});
}

async function getCampaignSummaryReport({
	auth,
	campaignId,
}: {
	auth: EmailOctopusAuthValue;
	campaignId: string;
}): Promise<EmailOctopusCampaignSummaryReport> {
	return await emailOctopusClient.request<EmailOctopusCampaignSummaryReport>({
		auth,
		method: HttpMethod.GET,
		path: `/campaigns/${campaignId}/reports/summary`,
	});
}

async function listContacts({
	auth,
	listId,
	filters,
	...page
}: PageParams & {
	auth: EmailOctopusAuthValue;
	listId: string;
	filters: QueryParams;
}): Promise<EmailOctopusPage<EmailOctopusContact>> {
	return await emailOctopusClient.request<EmailOctopusPage<EmailOctopusContact>>({
		auth,
		method: HttpMethod.GET,
		path: `/lists/${listId}/contacts`,
		query: { ...filters, ...pageQuery(page) },
	});
}

async function getContact({
	auth,
	listId,
	contact,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
	contact: string;
}): Promise<EmailOctopusContact> {
	return await emailOctopusClient.request<EmailOctopusContact>({
		auth,
		method: HttpMethod.GET,
		path: `/lists/${listId}/contacts/${contactPathId({ contact })}`,
	});
}

async function findContact({
	auth,
	listId,
	emailAddress,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
	emailAddress: string;
}): Promise<EmailOctopusContact | null> {
	try {
		return await getContact({ auth, listId, contact: emailAddress });
	} catch (error) {
		if (error instanceof HttpError && error.response.status === 404) {
			return null;
		}
		throw error;
	}
}

async function createContact({
	auth,
	listId,
	contact,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
	contact: EmailOctopusContactCreate;
}): Promise<EmailOctopusContact> {
	return await emailOctopusClient.request<EmailOctopusContact>({
		auth,
		method: HttpMethod.POST,
		path: `/lists/${listId}/contacts`,
		body: contact,
	});
}

async function upsertContact({
	auth,
	listId,
	emailAddress,
	fields,
	tags,
	status,
}: UpsertContactParams & {
	auth: EmailOctopusAuthValue;
}): Promise<EmailOctopusContact> {
	const body: Record<string, unknown> = {
		email_address: emailAddress,
	};
	if (fields) {
		body['fields'] = Object.fromEntries(
			Object.entries(fields).filter(
				([, value]) => value !== null && value !== undefined && value !== '',
			),
		);
	}
	if (status) {
		body['status'] = status;
	}
	if (tags && tags.length > 0) {
		body['tags'] = Object.fromEntries(tags.map((tag) => [tag, true]));
	}
	return await putContact({ auth, listId, body });
}

async function putContact({
	auth,
	listId,
	body,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
	body: object;
}): Promise<EmailOctopusContact> {
	return await emailOctopusClient.request<EmailOctopusContact>({
		auth,
		method: HttpMethod.PUT,
		path: `/lists/${listId}/contacts`,
		body,
	});
}

async function updateContact({
	auth,
	listId,
	contact,
	update,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
	contact: string;
	update: EmailOctopusContactUpdate;
}): Promise<EmailOctopusContact> {
	return await emailOctopusClient.request<EmailOctopusContact>({
		auth,
		method: HttpMethod.PUT,
		path: `/lists/${listId}/contacts/${contactPathId({ contact })}`,
		body: update,
	});
}

async function deleteContact({
	auth,
	listId,
	contact,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
	contact: string;
}): Promise<void> {
	await emailOctopusClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/lists/${listId}/contacts/${contactPathId({ contact })}`,
	});
}

async function updateContactsBatch({
	auth,
	listId,
	contacts,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
	contacts: EmailOctopusContactBatchItem[];
}): Promise<EmailOctopusContactBatchResult> {
	return await emailOctopusClient.request<EmailOctopusContactBatchResult>({
		auth,
		method: HttpMethod.PUT,
		path: `/lists/${listId}/contacts/batch`,
		body: { contacts },
	});
}

async function startAutomation({
	auth,
	automationId,
	contactId,
}: {
	auth: EmailOctopusAuthValue;
	automationId: string;
	contactId: string;
}): Promise<void> {
	await emailOctopusClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: `/automations/${automationId}/queue`,
		body: { contact_id: contactId },
	});
}

function contactPathId({ contact }: { contact: string }): string {
	if (!contact.includes('@')) {
		return contact;
	}
	return createHash('md5').update(contact.toLowerCase()).digest('hex');
}

function pageQuery({ limit, startingAfter }: PageParams): QueryParams {
	return {
		...(limit !== undefined ? { limit: String(limit) } : {}),
		...(startingAfter ? { starting_after: startingAfter } : {}),
	};
}

export const emailOctopusApi = {
	listLists,
	listListsPage,
	getList,
	createList,
	updateList,
	deleteList,
	createField,
	updateField,
	deleteField,
	listTags,
	createTag,
	updateTag,
	deleteTag,
	listCampaigns,
	listCampaignsPage,
	getCampaign,
	getCampaignContactReport,
	getCampaignLinksReport,
	getCampaignSummaryReport,
	listContacts,
	getContact,
	findContact,
	createContact,
	upsertContact,
	putContact,
	updateContact,
	deleteContact,
	updateContactsBatch,
	startAutomation,
};

type PageParams = { limit?: number; startingAfter?: string };

type UpsertContactParams = {
	listId: string;
	emailAddress: string;
	fields?: Record<string, unknown>;
	tags?: string[];
	status?: string;
};
