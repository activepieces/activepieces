import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { senderClient } from './client';

import type {
	SenderAuthValue,
	SenderCampaign,
	SenderCampaignReport,
	SenderGroup,
	SenderPage,
	SenderRecord,
	SenderSubscriber,
	SenderTransactionalReport,
	SenderUser,
	SenderWebhook,
} from './types';

async function getMe({ auth }: { auth: SenderAuthValue }): Promise<SenderUser> {
	const response = await senderClient.request<{ data: SenderUser }>({
		auth,
		method: HttpMethod.GET,
		path: '/me',
	});
	return response.data;
}

async function listSubscribers({
	auth,
	page,
	limit,
}: PageParams & { auth: SenderAuthValue }): Promise<SenderPage<SenderSubscriber>> {
	return await senderClient.request<SenderPage<SenderSubscriber>>({
		auth,
		method: HttpMethod.GET,
		path: '/subscribers',
		query: toQuery({ page, limit }),
	});
}

async function getSubscriber({
	auth,
	subscriberId,
}: {
	auth: SenderAuthValue;
	subscriberId: string;
}): Promise<SenderSubscriber & SenderRecord> {
	const response = await senderClient.request<{ data: SenderSubscriber & SenderRecord }>({
		auth,
		method: HttpMethod.GET,
		path: `/subscribers/${encodeURIComponent(subscriberId)}`,
	});
	return response.data;
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
}: UpsertSubscriberParams & { auth: SenderAuthValue }): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.POST,
		path: '/subscribers',
		body: {
			email,
			firstname,
			lastname,
			phone,
			groups,
			fields: customFields,
			trigger_automation: triggerAutomation,
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
	subscriberStatus,
	smsStatus,
	transactionalEmailStatus,
	triggerAutomation,
}: UpdateSubscriberParams & { auth: SenderAuthValue }): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.PATCH,
		path: `/subscribers/${encodeURIComponent(subscriberId)}`,
		body: {
			groups,
			firstname,
			lastname,
			phone,
			fields: customFields,
			subscriber_status: subscriberStatus,
			sms_status: smsStatus,
			transactional_email_status: transactionalEmailStatus,
			trigger_automation: triggerAutomation,
		},
	});
}

async function deleteSubscribers({
	auth,
	subscribers,
}: {
	auth: SenderAuthValue;
	subscribers: string[];
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.DELETE,
		path: '/subscribers',
		body: { subscribers },
	});
}

async function listSubscriberEvents({
	auth,
	subscriberId,
	actions,
}: {
	auth: SenderAuthValue;
	subscriberId: string;
	actions: string[];
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.GET,
		path: `/subscribers/${encodeURIComponent(subscriberId)}/events`,
		query: { actions: JSON.stringify(actions) },
	});
}

async function addSubscribersToGroup({
	auth,
	groupId,
	subscribers,
	triggerAutomation,
}: GroupMembershipParams & { auth: SenderAuthValue }): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.POST,
		path: `/subscribers/groups/${groupId}`,
		body: { subscribers, trigger_automation: triggerAutomation },
	});
}

async function removeSubscribersFromGroup({
	auth,
	groupId,
	subscribers,
	triggerAutomation,
}: GroupMembershipParams & { auth: SenderAuthValue }): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.DELETE,
		path: `/subscribers/groups/${groupId}`,
		body: { subscribers, trigger_automation: triggerAutomation },
	});
}

async function createCustomEvent({
	auth,
	subscriber,
	type,
	value,
	valueCurrency,
	properties,
}: CreateCustomEventParams & { auth: SenderAuthValue }): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.POST,
		path: '/events',
		body: { subscriber, type, value, value_currency: valueCurrency, properties },
	});
}

async function listGroups({
	auth,
	page,
	limit,
}: PageParams & { auth: SenderAuthValue }): Promise<SenderPage<SenderGroup>> {
	return await senderClient.request<SenderPage<SenderGroup>>({
		auth,
		method: HttpMethod.GET,
		path: '/groups',
		query: toQuery({ page, limit }),
	});
}

async function getGroup({
	auth,
	groupId,
}: {
	auth: SenderAuthValue;
	groupId: string;
}): Promise<SenderRecord> {
	const response = await senderClient.request<{ data: SenderRecord }>({
		auth,
		method: HttpMethod.GET,
		path: `/groups/${groupId}`,
	});
	return response.data;
}

async function createGroup({
	auth,
	title,
}: {
	auth: SenderAuthValue;
	title: string;
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.POST,
		path: '/groups',
		body: { title },
	});
}

async function renameGroup({
	auth,
	groupId,
	title,
}: {
	auth: SenderAuthValue;
	groupId: string;
	title: string;
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.PATCH,
		path: `/groups/${groupId}`,
		body: { title },
	});
}

async function deleteGroup({
	auth,
	groupId,
	deleteSubscribers,
}: {
	auth: SenderAuthValue;
	groupId: string;
	deleteSubscribers?: boolean;
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.DELETE,
		path: `/groups/${groupId}`,
		body: { delete_subscribers: deleteSubscribers },
	});
}

async function listGroupSubscribers({
	auth,
	groupId,
	page,
	limit,
}: PageParams & { auth: SenderAuthValue; groupId: string }): Promise<SenderPage<SenderSubscriber>> {
	return await senderClient.request<SenderPage<SenderSubscriber>>({
		auth,
		method: HttpMethod.GET,
		path: `/groups/${groupId}/subscribers`,
		query: toQuery({ page, limit }),
	});
}

async function listFields({
	auth,
	page,
	limit,
}: PageParams & { auth: SenderAuthValue }): Promise<SenderPage<SenderRecord>> {
	return await senderClient.request<SenderPage<SenderRecord>>({
		auth,
		method: HttpMethod.GET,
		path: '/fields',
		query: toQuery({ page, limit }),
	});
}

async function createField({
	auth,
	title,
	type,
}: {
	auth: SenderAuthValue;
	title: string;
	type: string;
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.POST,
		path: '/fields',
		body: { title, type },
	});
}

async function updateField({
	auth,
	fieldId,
	title,
	show,
}: {
	auth: SenderAuthValue;
	fieldId: string;
	title?: string;
	show?: boolean;
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.PATCH,
		path: `/fields/${fieldId}`,
		body: { title, show },
	});
}

async function deleteField({
	auth,
	fieldId,
}: {
	auth: SenderAuthValue;
	fieldId: string;
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.DELETE,
		path: `/fields/${fieldId}`,
	});
}

async function listSegments({
	auth,
	page,
	limit,
}: PageParams & { auth: SenderAuthValue }): Promise<SenderPage<SenderRecord>> {
	return await senderClient.request<SenderPage<SenderRecord>>({
		auth,
		method: HttpMethod.GET,
		path: '/segments',
		query: toQuery({ page, limit }),
	});
}

async function getSegment({
	auth,
	segmentId,
}: {
	auth: SenderAuthValue;
	segmentId: string;
}): Promise<SenderRecord> {
	const response = await senderClient.request<{ data: SenderRecord }>({
		auth,
		method: HttpMethod.GET,
		path: `/segments/${segmentId}`,
	});
	return response.data;
}

async function listSegmentSubscribers({
	auth,
	segmentId,
	page,
	limit,
}: PageParams & { auth: SenderAuthValue; segmentId: string }): Promise<
	SenderPage<SenderSubscriber>
> {
	return await senderClient.request<SenderPage<SenderSubscriber>>({
		auth,
		method: HttpMethod.GET,
		path: `/segments/${segmentId}/subscribers`,
		query: toQuery({ page, limit }),
	});
}

async function listCampaigns({
	auth,
	page,
	limit,
	status,
}: PageParams & { auth: SenderAuthValue; status?: string }): Promise<SenderPage<SenderCampaign>> {
	return await senderClient.request<SenderPage<SenderCampaign>>({
		auth,
		method: HttpMethod.GET,
		path: '/campaigns',
		query: toQuery({ limit, page, status }),
	});
}

async function getCampaign({
	auth,
	campaignId,
}: {
	auth: SenderAuthValue;
	campaignId: string;
}): Promise<SenderRecord> {
	const response = await senderClient.request<{ data: SenderRecord }>({
		auth,
		method: HttpMethod.GET,
		path: `/campaigns/${campaignId}`,
	});
	return response.data;
}

async function createCampaign({
	auth,
	title,
	subject,
	from,
	replyTo,
	contentType,
	groups,
	segments,
	preheader,
	content,
	googleAnalytics,
	autoFollowupActive,
	autoFollowupSubject,
	autoFollowupDelay,
}: CreateCampaignParams & { auth: SenderAuthValue }): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
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
			segments,
			preheader,
			content,
			google_analytics: googleAnalytics,
			auto_followup_active: autoFollowupActive,
			auto_followup_subject: autoFollowupSubject,
			auto_followup_delay: autoFollowupDelay,
		},
	});
}

async function deleteCampaigns({
	auth,
	campaignIds,
}: {
	auth: SenderAuthValue;
	campaignIds: string[];
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.DELETE,
		path: '/campaigns',
		query: { ids: `[${campaignIds.join(',')}]` },
	});
}

async function copyCampaign({
	auth,
	campaignId,
}: {
	auth: SenderAuthValue;
	campaignId: string;
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.POST,
		path: `/campaigns/${campaignId}/copy`,
	});
}

async function sendCampaign({
	auth,
	campaignId,
}: {
	auth: SenderAuthValue;
	campaignId: string;
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.POST,
		path: `/campaigns/${campaignId}/send`,
	});
}

async function cancelCampaignSchedule({
	auth,
	campaignId,
}: {
	auth: SenderAuthValue;
	campaignId: string;
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.DELETE,
		path: `/campaigns/${campaignId}/schedule`,
	});
}

async function cancelCampaignFollowup({
	auth,
	campaignId,
}: {
	auth: SenderAuthValue;
	campaignId: string;
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.POST,
		path: `/campaigns/${campaignId}/cancel_followup`,
	});
}

async function listCampaignErrors({
	auth,
	campaignId,
}: {
	auth: SenderAuthValue;
	campaignId: string;
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.GET,
		path: `/campaigns/${campaignId}/errors`,
	});
}

async function listCampaignReport({
	auth,
	campaignId,
	report,
	page,
	limit,
}: PageParams & {
	auth: SenderAuthValue;
	campaignId: string;
	report: SenderCampaignReport;
}): Promise<SenderPage<SenderRecord>> {
	return await senderClient.request<SenderPage<SenderRecord>>({
		auth,
		method: HttpMethod.GET,
		path: `/campaigns/${campaignId}/${report}`,
		query: toQuery({ page, limit }),
	});
}

async function listTransactionalCampaigns({
	auth,
	page,
	limit,
}: PageParams & { auth: SenderAuthValue }): Promise<SenderPage<SenderRecord>> {
	return await senderClient.request<SenderPage<SenderRecord>>({
		auth,
		method: HttpMethod.GET,
		path: '/transactional',
		query: toQuery({ page, limit }),
	});
}

async function getTransactionalCampaign({
	auth,
	campaignId,
}: {
	auth: SenderAuthValue;
	campaignId: string;
}): Promise<SenderRecord> {
	const response = await senderClient.request<{ data: SenderRecord }>({
		auth,
		method: HttpMethod.GET,
		path: `/transactional/${campaignId}`,
	});
	return response.data;
}

async function createTransactionalCampaign({
	auth,
	title,
	subject,
	from,
	replyTo,
	editor,
	preheader,
	content,
}: TransactionalCampaignParams & { auth: SenderAuthValue }): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.POST,
		path: '/transactional',
		body: { title, subject, from, reply_to: replyTo, editor, preheader, content },
	});
}

async function updateTransactionalCampaign({
	auth,
	campaignId,
	title,
	subject,
	from,
	replyTo,
	editor,
	preheader,
}: Partial<TransactionalCampaignParams> & {
	auth: SenderAuthValue;
	campaignId: string;
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.PATCH,
		path: `/transactional/${campaignId}`,
		body: { title, subject, from, reply_to: replyTo, editor, preheader },
	});
}

async function deleteTransactionalCampaigns({
	auth,
	campaignIds,
}: {
	auth: SenderAuthValue;
	campaignIds: string[];
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.DELETE,
		path: '/transactional',
		query: { ids: `[${campaignIds.join(',')}]` },
	});
}

async function getTransactionalCampaignReport({
	auth,
	campaignId,
	from,
	to,
	period,
}: {
	auth: SenderAuthValue;
	campaignId: string;
	from: string;
	to: string;
	period: string;
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.GET,
		path: `/transactional/${campaignId}/report`,
		query: { from, to, period },
	});
}

async function listTransactionalReport({
	auth,
	campaignId,
	report,
	page,
	limit,
	direction,
}: PageParams & {
	auth: SenderAuthValue;
	campaignId: string;
	report: SenderTransactionalReport;
	direction?: string;
}): Promise<SenderPage<SenderRecord>> {
	return await senderClient.request<SenderPage<SenderRecord>>({
		auth,
		method: HttpMethod.GET,
		path: `/transactional/${campaignId}/${report}`,
		query: toQuery({ page, limit, direction }),
	});
}

async function listWorkflows({
	auth,
	page,
	limit,
	status,
	title,
}: PageParams & { auth: SenderAuthValue; status?: string; title?: string }): Promise<
	SenderPage<SenderRecord>
> {
	return await senderClient.request<SenderPage<SenderRecord>>({
		auth,
		method: HttpMethod.GET,
		path: '/workflows',
		query: toQuery({ page, limit, status, title }),
	});
}

async function getWorkflow({
	auth,
	workflowId,
}: {
	auth: SenderAuthValue;
	workflowId: string;
}): Promise<SenderRecord> {
	const response = await senderClient.request<{ data: SenderRecord }>({
		auth,
		method: HttpMethod.GET,
		path: `/workflows/${workflowId}`,
	});
	return response.data;
}

async function listWorkflowSteps({
	auth,
	workflowId,
	batchNo,
}: {
	auth: SenderAuthValue;
	workflowId: string;
	batchNo?: number;
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.GET,
		path: `/workflows/${workflowId}/steps`,
		query: toQuery({ batch_no: batchNo }),
	});
}

async function getWorkflowStatistics({
	auth,
	workflowId,
}: {
	auth: SenderAuthValue;
	workflowId: string;
}): Promise<SenderRecord> {
	return await senderClient.request<SenderRecord>({
		auth,
		method: HttpMethod.GET,
		path: `/workflows/${workflowId}/average_report`,
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

function toQuery(params: Record<string, string | number | undefined>): QueryParams {
	return Object.fromEntries(
		Object.entries(params).flatMap(([key, value]) =>
			value === undefined ? [] : [[key, String(value)]],
		),
	);
}

export const senderApi = {
	getMe,
	listSubscribers,
	getSubscriber,
	upsertSubscriber,
	updateSubscriber,
	deleteSubscribers,
	listSubscriberEvents,
	addSubscribersToGroup,
	removeSubscribersFromGroup,
	createCustomEvent,
	listGroups,
	getGroup,
	createGroup,
	renameGroup,
	deleteGroup,
	listGroupSubscribers,
	listFields,
	createField,
	updateField,
	deleteField,
	listSegments,
	getSegment,
	listSegmentSubscribers,
	listCampaigns,
	getCampaign,
	createCampaign,
	deleteCampaigns,
	copyCampaign,
	sendCampaign,
	cancelCampaignSchedule,
	cancelCampaignFollowup,
	listCampaignErrors,
	listCampaignReport,
	listTransactionalCampaigns,
	getTransactionalCampaign,
	createTransactionalCampaign,
	updateTransactionalCampaign,
	deleteTransactionalCampaigns,
	getTransactionalCampaignReport,
	listTransactionalReport,
	listWorkflows,
	getWorkflow,
	listWorkflowSteps,
	getWorkflowStatistics,
	createWebhook,
	deleteWebhook,
};

type PageParams = { page?: number; limit?: number };

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
	subscriberStatus?: string;
	smsStatus?: string;
	transactionalEmailStatus?: string;
	triggerAutomation?: boolean;
};

type GroupMembershipParams = {
	groupId: string | undefined;
	subscribers: string[];
	triggerAutomation?: boolean;
};

type CreateCustomEventParams = {
	subscriber: { id?: string; email?: string; phone?: string };
	type: string;
	value?: number;
	valueCurrency?: string;
	properties?: unknown;
};

type CreateCampaignParams = {
	title?: string;
	subject: string;
	from: string;
	replyTo: string;
	contentType: string;
	groups?: string[];
	segments?: string[];
	preheader?: string;
	content?: string;
	googleAnalytics?: number;
	autoFollowupActive?: boolean;
	autoFollowupSubject?: string;
	autoFollowupDelay?: number;
};

type TransactionalCampaignParams = {
	title?: string;
	subject: string;
	from: string;
	replyTo: string;
	editor: string;
	preheader?: string;
	content?: string;
};
