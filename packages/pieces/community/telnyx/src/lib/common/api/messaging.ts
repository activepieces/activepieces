import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { telnyxClient } from '../client';

import type { TelnyxAuthValue, TelnyxPage, TelnyxRecord } from '../types';

async function createMessage({
	auth,
	body,
}: BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.POST,
		path: '/messages',
		body,
	});
	return response.data;
}

async function sendGroupMms({
	auth,
	body,
}: BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.POST,
		path: '/messages/group_mms',
		body,
	});
	return response.data;
}

async function scheduleMessage({
	auth,
	body,
}: BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.POST,
		path: '/messages/schedule',
		body,
	});
	return response.data;
}

async function getMessage({
	auth,
	messageId,
}: {
	auth: TelnyxAuthValue;
	messageId: string;
}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.GET,
		path: `/messages/${encodeURIComponent(messageId)}`,
	});
	return response.data;
}

async function cancelScheduledMessage({
	auth,
	messageId,
}: {
	auth: TelnyxAuthValue;
	messageId: string;
}): Promise<TelnyxRecord> {
	return await telnyxClient.request<TelnyxRecord>({
		auth,
		method: HttpMethod.DELETE,
		path: `/messages/${encodeURIComponent(messageId)}`,
	});
}

async function getGroupMms({
	auth,
	messageId,
}: {
	auth: TelnyxAuthValue;
	messageId: string;
}): Promise<TelnyxRecord[]> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord[] }>({
		auth,
		method: HttpMethod.GET,
		path: `/messages/group/${encodeURIComponent(messageId)}`,
	});
	return response.data ?? [];
}

async function listMessagingOptouts({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/messaging_optouts',
		query,
	});
}

async function listMessagingProfileMetrics({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/messaging_profile_metrics',
		query,
	});
}

async function listMessagingUrlDomains({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/messaging_url_domains',
		query,
	});
}

export const telnyxMessagingApi = {
	createMessage,
	sendGroupMms,
	scheduleMessage,
	getMessage,
	cancelScheduledMessage,
	getGroupMms,
	listMessagingOptouts,
	listMessagingProfileMetrics,
	listMessagingUrlDomains,
};

type BodyParams = { body: Record<string, unknown> };
type QueryOnlyParams = { query: QueryParams };
