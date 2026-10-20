import { HttpMethod } from '@activepieces/pieces-common';

import { senderClient } from './client';

import type {
	SenderAuthValue,
	SenderCampaign,
	SenderGroup,
	SenderPage,
	SenderSubscriber,
	SenderWebhook,
} from './types';

async function listGroups({
	auth,
	limit,
}: {
	auth: SenderAuthValue;
	limit?: number;
}): Promise<SenderGroup[]> {
	const response = await senderClient.request<SenderPage<SenderGroup>>({
		auth,
		method: HttpMethod.GET,
		path: '/groups',
		query: limit ? { limit: String(limit) } : undefined,
	});
	return response.data ?? [];
}

async function listSubscribers({
	auth,
	limit,
}: {
	auth: SenderAuthValue;
	limit: number;
}): Promise<SenderSubscriber[]> {
	const response = await senderClient.request<SenderPage<SenderSubscriber>>({
		auth,
		method: HttpMethod.GET,
		path: '/subscribers',
		query: { limit: String(limit) },
	});
	return response.data ?? [];
}

async function listGroupSubscribers({
	auth,
	groupId,
	limit,
}: {
	auth: SenderAuthValue;
	groupId: string;
	limit: number;
}): Promise<SenderSubscriber[]> {
	const response = await senderClient.request<SenderPage<SenderSubscriber>>({
		auth,
		method: HttpMethod.GET,
		path: `/groups/${groupId}/subscribers`,
		query: { limit: String(limit) },
	});
	return response.data ?? [];
}

async function listCampaigns({
	auth,
	limit,
	status,
}: {
	auth: SenderAuthValue;
	limit: number;
	status?: string;
}): Promise<SenderCampaign[]> {
	const response = await senderClient.request<SenderPage<SenderCampaign>>({
		auth,
		method: HttpMethod.GET,
		path: '/campaigns',
		query: { limit: String(limit), ...(status ? { status } : {}) },
	});
	return response.data ?? [];
}

async function upsertSubscriber({
	auth,
	email,
	firstname,
	lastname,
	phone,
	groups,
	customFields,
	triggerAutomation,
}: UpsertSubscriberParams & { auth: SenderAuthValue }): Promise<unknown> {
	return await senderClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: '/subscribers',
		body: {
			email,
			...(firstname ? { firstname } : {}),
			...(lastname ? { lastname } : {}),
			...(phone ? { phone } : {}),
			...(groups ? { groups } : {}),
			...(customFields ? { fields: customFields } : {}),
			...(triggerAutomation ? { trigger_automation: true } : {}),
		},
	});
}

async function updateSubscriber({
	auth,
	subscriberId,
	firstname,
	lastname,
	phone,
	groups,
	customFields,
}: UpdateSubscriberParams & { auth: SenderAuthValue }): Promise<unknown> {
	return await senderClient.request<unknown>({
		auth,
		method: HttpMethod.PATCH,
		path: `/subscribers/${subscriberId}`,
		body: {
			...(groups ? { groups } : {}),
			...(firstname ? { firstname } : {}),
			...(lastname ? { lastname } : {}),
			...(phone ? { phone } : {}),
			...(customFields ? { fields: customFields } : {}),
		},
	});
}

async function deleteSubscribers({
	auth,
	subscribers,
}: {
	auth: SenderAuthValue;
	subscribers: string[];
}): Promise<unknown> {
	return await senderClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: '/subscribers',
		body: { subscribers },
	});
}

async function removeSubscribersFromGroup({
	auth,
	groupId,
	subscribers,
}: {
	auth: SenderAuthValue;
	groupId: string | undefined;
	subscribers: string[];
}): Promise<unknown> {
	return await senderClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/subscribers/groups/${groupId}`,
		body: { subscribers },
	});
}

async function createCampaign({
	auth,
	title,
	subject,
	from,
	replyTo,
	contentType,
	groups,
}: CreateCampaignParams & { auth: SenderAuthValue }): Promise<unknown> {
	return await senderClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: '/campaigns',
		body: {
			title,
			subject,
			from,
			content_type: contentType,
			groups,
			...(replyTo ? { reply_to: replyTo } : {}),
		},
	});
}

async function sendCampaign({
	auth,
	campaignId,
}: {
	auth: SenderAuthValue;
	campaignId: string;
}): Promise<unknown> {
	return await senderClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: `/campaigns/${campaignId}/send`,
	});
}

async function createWebhook({
	auth,
	url,
	topic,
	relationId,
}: {
	auth: SenderAuthValue;
	url: string;
	topic: string;
	relationId?: string;
}): Promise<SenderWebhook> {
	const response = await senderClient.request<{ data: SenderWebhook }>({
		auth,
		method: HttpMethod.POST,
		path: '/account/webhooks',
		body: { url, topic, ...(relationId ? { relation_id: relationId } : {}) },
	});
	return response.data;
}

async function deleteWebhook({
	auth,
	webhookId,
}: {
	auth: SenderAuthValue;
	webhookId: string;
}): Promise<void> {
	await senderClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/account/webhooks/${webhookId}`,
	});
}

export const senderApi = {
	listGroups,
	listSubscribers,
	listGroupSubscribers,
	listCampaigns,
	upsertSubscriber,
	updateSubscriber,
	deleteSubscribers,
	removeSubscribersFromGroup,
	createCampaign,
	sendCampaign,
	createWebhook,
	deleteWebhook,
};

type UpsertSubscriberParams = {
	email: string;
	firstname?: string;
	lastname?: string;
	phone?: string;
	groups?: string[];
	customFields?: unknown;
	triggerAutomation?: boolean;
};

type UpdateSubscriberParams = {
	subscriberId: string;
	firstname?: string;
	lastname?: string;
	phone?: string;
	groups?: string[];
	customFields?: unknown;
};

type CreateCampaignParams = {
	title?: string;
	subject: string;
	from: string;
	replyTo: string;
	contentType: string;
	groups?: string[];
};
