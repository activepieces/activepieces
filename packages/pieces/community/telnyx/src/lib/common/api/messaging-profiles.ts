import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { telnyxClient } from '../client';

import type { TelnyxAuthValue, TelnyxPage, TelnyxRecord } from '../types';

async function requestData({
	auth,
	method,
	path,
	query,
	body,
}: DataRequestParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method,
		path,
		query,
		body,
	});
	return response.data;
}

function profilePath({ messagingProfileId }: { messagingProfileId: string }): string {
	return `/messaging_profiles/${encodeURIComponent(messagingProfileId)}`;
}

function autoResponsePath({
	messagingProfileId,
	autoResponseId,
}: {
	messagingProfileId: string;
	autoResponseId: string;
}): string {
	return `${profilePath({ messagingProfileId })}/autoresp_configs/${encodeURIComponent(
		autoResponseId,
	)}`;
}

async function listMessagingProfilesPage({
	auth,
	query,
}: { query: QueryParams } & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/messaging_profiles',
		query,
	});
}

async function createMessagingProfile({
	auth,
	body,
}: BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.POST,
		path: '/messaging_profiles',
		body,
	});
}

async function getMessagingProfile({
	auth,
	messagingProfileId,
}: ProfileParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: profilePath({ messagingProfileId }),
	});
}

async function updateMessagingProfile({
	auth,
	messagingProfileId,
	body,
}: ProfileParams & BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.PATCH,
		path: profilePath({ messagingProfileId }),
		body,
	});
}

async function deleteMessagingProfile({
	auth,
	messagingProfileId,
}: ProfileParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.DELETE,
		path: profilePath({ messagingProfileId }),
	});
}

async function listMessagingProfilePhoneNumbers({
	auth,
	messagingProfileId,
	query,
}: ProfileParams & { query: QueryParams } & {
	auth: TelnyxAuthValue;
}): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: `${profilePath({ messagingProfileId })}/phone_numbers`,
		query,
	});
}

async function listMessagingProfileShortCodes({
	auth,
	messagingProfileId,
	query,
}: ProfileParams & { query: QueryParams } & {
	auth: TelnyxAuthValue;
}): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: `${profilePath({ messagingProfileId })}/short_codes`,
		query,
	});
}

async function listMessagingProfileAlphanumericSenderIds({
	auth,
	messagingProfileId,
	query,
}: ProfileParams & { query: QueryParams } & {
	auth: TelnyxAuthValue;
}): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: `${profilePath({ messagingProfileId })}/alphanumeric_sender_ids`,
		query,
	});
}

async function getMessagingProfileMetrics({
	auth,
	messagingProfileId,
	query,
}: ProfileParams & { query: QueryParams } & {
	auth: TelnyxAuthValue;
}): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: `${profilePath({ messagingProfileId })}/metrics`,
		query,
	});
}

async function regenerateMessagingProfileSecret({
	auth,
	messagingProfileId,
}: ProfileParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.POST,
		path: `${profilePath({ messagingProfileId })}/actions/regenerate_secret`,
	});
}

async function listAutoResponses({
	auth,
	messagingProfileId,
	query,
}: ProfileParams & { query: QueryParams } & {
	auth: TelnyxAuthValue;
}): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: `${profilePath({ messagingProfileId })}/autoresp_configs`,
		query,
	});
}

async function createAutoResponse({
	auth,
	messagingProfileId,
	body,
}: ProfileParams & BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.POST,
		path: `${profilePath({ messagingProfileId })}/autoresp_configs`,
		body,
	});
}

async function getAutoResponse({
	auth,
	messagingProfileId,
	autoResponseId,
}: AutoResponseParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: autoResponsePath({ messagingProfileId, autoResponseId }),
	});
}

async function updateAutoResponse({
	auth,
	messagingProfileId,
	autoResponseId,
	body,
}: AutoResponseParams & BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.PUT,
		path: autoResponsePath({ messagingProfileId, autoResponseId }),
		body,
	});
}

async function deleteAutoResponse({
	auth,
	messagingProfileId,
	autoResponseId,
}: AutoResponseParams & { auth: TelnyxAuthValue }): Promise<unknown> {
	return await telnyxClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: autoResponsePath({ messagingProfileId, autoResponseId }),
	});
}

export const telnyxMessagingProfilesApi = {
	listMessagingProfilesPage,
	createMessagingProfile,
	getMessagingProfile,
	updateMessagingProfile,
	deleteMessagingProfile,
	listMessagingProfilePhoneNumbers,
	listMessagingProfileShortCodes,
	listMessagingProfileAlphanumericSenderIds,
	getMessagingProfileMetrics,
	regenerateMessagingProfileSecret,
	listAutoResponses,
	createAutoResponse,
	getAutoResponse,
	updateAutoResponse,
	deleteAutoResponse,
};

type DataRequestParams = {
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: Record<string, unknown>;
};
type BodyParams = { body: Record<string, unknown> };
type ProfileParams = { messagingProfileId: string };
type AutoResponseParams = ProfileParams & { autoResponseId: string };
