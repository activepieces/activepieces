import { createHash } from 'crypto';

import { HttpError, HttpMethod } from '@activepieces/pieces-common';

import { emailOctopusClient } from './client';

import type {
	EmailOctopusAuthValue,
	EmailOctopusCampaign,
	EmailOctopusContact,
	EmailOctopusContactUpdate,
	EmailOctopusList,
	EmailOctopusListDetails,
} from './types';

async function listLists({ auth }: { auth: EmailOctopusAuthValue }): Promise<EmailOctopusList[]> {
	const response = await emailOctopusClient.request<{
		data: EmailOctopusList[];
	}>({ auth, method: HttpMethod.GET, path: '/lists' });
	return response.data;
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
	return await emailOctopusClient.request<EmailOctopusContact>({
		auth,
		method: HttpMethod.PUT,
		path: `/lists/${listId}/contacts`,
		body,
	});
}

async function getContact({
	auth,
	listId,
	emailAddress,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
	emailAddress: string;
}): Promise<EmailOctopusContact | null> {
	try {
		return await emailOctopusClient.request<EmailOctopusContact>({
			auth,
			method: HttpMethod.GET,
			path: `/lists/${listId}/contacts/${contactId({ emailAddress })}`,
		});
	} catch (error) {
		if (error instanceof HttpError && error.response.status === 404) {
			return null;
		}
		throw error;
	}
}

async function updateContact({
	auth,
	listId,
	emailAddress,
	update,
}: {
	auth: EmailOctopusAuthValue;
	listId: string;
	emailAddress: string;
	update: EmailOctopusContactUpdate;
}): Promise<EmailOctopusContact> {
	return await emailOctopusClient.request<EmailOctopusContact>({
		auth,
		method: HttpMethod.PUT,
		path: `/lists/${listId}/contacts/${contactId({ emailAddress })}`,
		body: update,
	});
}

function contactId({ emailAddress }: { emailAddress: string }): string {
	return createHash('md5').update(emailAddress.toLowerCase()).digest('hex');
}

export const emailOctopusApi = {
	listLists,
	getList,
	createList,
	listCampaigns,
	upsertContact,
	getContact,
	updateContact,
};

type UpsertContactParams = {
	listId: string;
	emailAddress: string;
	fields?: Record<string, unknown>;
	tags?: string[];
	status?: string;
};
