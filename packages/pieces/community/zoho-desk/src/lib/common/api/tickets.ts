import { HttpMethod } from '@activepieces/pieces-common';

import { zohoDeskClient } from '../client';

import type { ZohoDeskAuthValue, ZohoDeskPage, ZohoDeskRecord, ZohoDeskTicket } from '../types';

async function listTickets({
	auth,
	orgId,
	include,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	include?: string[];
}): Promise<ZohoDeskPage<ZohoDeskTicket>> {
	const query: Record<string, string> = {};
	if (include) query['include'] = include.join(',');

	return await zohoDeskClient.request<ZohoDeskPage<ZohoDeskTicket>>({
		auth,
		method: HttpMethod.GET,
		path: '/tickets',
		orgId,
		query,
	});
}

async function createTicket({
	auth,
	orgId,
	...fields
}: CreateTicketParams & { auth: ZohoDeskAuthValue }): Promise<ZohoDeskTicket> {
	const body: Record<string, unknown> = {
		departmentId: fields.departmentId,
		subject: fields.subject,
		description: fields.description,
	};

	if (fields.contactId) body['contactId'] = fields.contactId;
	if (fields.email) body['email'] = fields.email;
	if (fields.phone) body['phone'] = fields.phone;
	if (fields.status) body['status'] = fields.status;
	if (fields.priority) body['priority'] = fields.priority;
	if (fields.category) body['category'] = fields.category;
	if (fields.subCategory) body['subCategory'] = fields.subCategory;
	if (fields.dueDate) body['dueDate'] = fields.dueDate;
	if (fields.channel) body['channel'] = fields.channel;
	if (fields.assigneeId) body['assigneeId'] = fields.assigneeId;
	if (fields.productId) body['productId'] = fields.productId;
	if (fields.classification) body['classification'] = fields.classification;
	if (fields.language) body['language'] = fields.language;
	if (fields.entitySkills && fields.entitySkills.length > 0)
		body['entitySkills'] = fields.entitySkills;
	if (fields.customFields) body['cf'] = fields.customFields;

	return await zohoDeskClient.request<ZohoDeskTicket>({
		auth,
		method: HttpMethod.POST,
		path: '/tickets',
		orgId,
		body,
	});
}

async function listTicketsByFilter({
	auth,
	orgId,
	departmentId,
	viewId,
	status,
	priority,
	assignee,
	channel,
	receivedInDays,
	sortBy,
	include,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	departmentId?: string;
	viewId?: string;
	status?: string[];
	priority?: string[];
	assignee?: string[];
	channel?: string[];
	receivedInDays?: string;
	sortBy?: string;
	include?: string[];
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets`,
		query: {
			departmentId,
			viewId,
			status,
			priority,
			assignee,
			channel,
			receivedInDays,
			sortBy,
			include,
			from,
			limit,
		},
	});
}

async function getTicket({
	auth,
	orgId,
	ticketId,
	include,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	include?: string[];
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}`,
		query: { include },
	});
}

async function updateTicket({
	auth,
	orgId,
	ticketId,
	subject,
	description,
	status,
	priority,
	assigneeId,
	contactId,
	productId,
	category,
	subCategory,
	dueDate,
	channel,
	classification,
	language,
	email,
	phone,
	customFields,
	disableClosureNotification,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	subject?: string;
	description?: string;
	status?: string;
	priority?: string;
	assigneeId?: string;
	contactId?: string;
	productId?: string;
	category?: string;
	subCategory?: string;
	dueDate?: string;
	channel?: string;
	classification?: string;
	language?: string;
	email?: string;
	phone?: string;
	customFields?: Record<string, unknown>;
	disableClosureNotification?: boolean;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PATCH,
		path: `/tickets/${encodeURIComponent(ticketId)}`,
		query: { disableClosureNotification },
		body: {
			subject,
			description,
			status,
			priority,
			assigneeId,
			contactId,
			productId,
			category,
			subCategory,
			dueDate,
			channel,
			classification,
			language,
			email,
			phone,
			cf: customFields,
		},
	});
}

async function searchTickets({
	auth,
	orgId,
	searchText,
	ticketNumber,
	subject,
	email,
	phone,
	contactId,
	accountId,
	assigneeId,
	departmentId,
	status,
	priority,
	createdTimeRange,
	modifiedTimeRange,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	searchText?: string;
	ticketNumber?: string;
	subject?: string;
	email?: string;
	phone?: string;
	contactId?: string;
	accountId?: string;
	assigneeId?: string;
	departmentId?: string;
	status?: string;
	priority?: string;
	createdTimeRange?: string;
	modifiedTimeRange?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/search`,
		query: {
			_all: searchText,
			ticketNumber,
			subject,
			email,
			phone,
			contactId,
			accountId,
			assigneeId,
			departmentId,
			status,
			priority,
			createdTimeRange,
			modifiedTimeRange,
			from,
			limit,
		},
	});
}

async function deleteTickets({
	auth,
	orgId,
	ticketIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketIds: string[];
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/moveToTrash`,
		body: { ticketIds },
	});
}

async function closeTickets({
	auth,
	orgId,
	ticketIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketIds: string[];
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/closeTickets`,
		body: { ids: ticketIds },
	});
}

async function updateManyTickets({
	auth,
	orgId,
	ticketIds,
	fieldName,
	fieldValue,
	isCustomField,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketIds: string[];
	fieldName: string;
	fieldValue?: string;
	isCustomField?: boolean;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/updateMany`,
		body: { ids: ticketIds, fieldName, fieldValue, isCustomField },
	});
}

async function mergeTickets({
	auth,
	orgId,
	ticketId,
	ticketIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	ticketIds: string[];
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/${encodeURIComponent(ticketId)}/merge`,
		body: { ids: ticketIds },
	});
}

async function moveTicket({
	auth,
	orgId,
	ticketId,
	departmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	departmentId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/${encodeURIComponent(ticketId)}/move`,
		query: { departmentId },
		body: { departmentId },
	});
}

async function listTicketHistory({
	auth,
	orgId,
	ticketId,
	agentId,
	fieldName,
	eventFilter,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	agentId?: string;
	fieldName?: string;
	eventFilter?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/History`,
		query: { agentId, fieldName, eventFilter, from, limit },
	});
}

async function getTicketMetrics({
	auth,
	orgId,
	ticketId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/metrics`,
	});
}

async function getTicketResolution({
	auth,
	orgId,
	ticketId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/resolution`,
	});
}

async function updateTicketResolution({
	auth,
	orgId,
	ticketId,
	content,
	isNotifyContact,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	content: string;
	isNotifyContact?: boolean;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PATCH,
		path: `/tickets/${encodeURIComponent(ticketId)}/resolution`,
		body: { content, isNotifyContact },
	});
}

async function deleteTicketResolution({
	auth,
	orgId,
	ticketId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.DELETE,
		path: `/tickets/${encodeURIComponent(ticketId)}/resolution`,
	});
}

async function countTickets({
	auth,
	orgId,
	departmentId,
	contactId,
	assigneeId,
	category,
	createdTimeRange,
	modifiedTimeRange,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	departmentId?: string;
	contactId?: string;
	assigneeId?: string;
	category?: string;
	createdTimeRange?: string;
	modifiedTimeRange?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/ticketsCount`,
		query: { departmentId, contactId, assigneeId, category, createdTimeRange, modifiedTimeRange },
	});
}

async function listTicketTags({
	auth,
	orgId,
	ticketId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/tags`,
	});
}

async function addTicketTags({
	auth,
	orgId,
	ticketId,
	tags,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	tags: string[];
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/${encodeURIComponent(ticketId)}/associateTag`,
		body: { tags },
	});
}

async function removeTicketTags({
	auth,
	orgId,
	ticketId,
	tags,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	tags: string[];
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/${encodeURIComponent(ticketId)}/dissociateTag`,
		body: { tags },
	});
}

async function getSuggestedArticles({
	auth,
	orgId,
	ticketId,
	departmentId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	departmentId?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/articleSuggestion`,
		query: { departmentId, from, limit },
	});
}

async function linkArticlesToTicket({
	auth,
	orgId,
	ticketId,
	articleIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	articleIds: string[];
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/${encodeURIComponent(ticketId)}/notifyArticleUsage`,
		body: { ids: articleIds },
	});
}

async function markTicketsSpam({
	auth,
	orgId,
	ticketIds,
	isSpam,
	contactSpam,
	handleExistingTickets,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketIds: string[];
	isSpam: boolean;
	contactSpam?: boolean;
	handleExistingTickets?: boolean;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/markSpam`,
		body: { ids: ticketIds, isSpam, contactSpam, handleExistingTickets },
	});
}

async function deleteSpamTickets({
	auth,
	orgId,
	ticketIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketIds: string[];
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/deleteSpam`,
		body: { ticketIds },
	});
}

async function listTicketFollowers({
	auth,
	orgId,
	ticketId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/followers`,
	});
}

async function addTicketFollowers({
	auth,
	orgId,
	ticketId,
	followerIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	followerIds: string[];
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/${encodeURIComponent(ticketId)}/addFollowers`,
		body: { followerIds },
	});
}

async function removeTicketFollowers({
	auth,
	orgId,
	ticketId,
	followerIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	followerIds: string[];
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/${encodeURIComponent(ticketId)}/removeFollowers`,
		body: { followerIds },
	});
}

async function listTicketActivities({
	auth,
	orgId,
	ticketId,
	isCompleted,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	isCompleted?: boolean;
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/activities`,
		query: { isCompleted, sortBy, from, limit },
	});
}

async function listTicketCalls({
	auth,
	orgId,
	ticketId,
	isCompleted,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	isCompleted?: boolean;
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/calls`,
		query: { isCompleted, sortBy, from, limit },
	});
}

async function listTicketEvents({
	auth,
	orgId,
	ticketId,
	isCompleted,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	isCompleted?: boolean;
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/events`,
		query: { isCompleted, sortBy, from, limit },
	});
}

async function listTicketResolutionHistory({
	auth,
	orgId,
	ticketId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/resolutionHistory`,
		query: { from, limit },
	});
}

async function markTicketRead({
	auth,
	orgId,
	ticketId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/${encodeURIComponent(ticketId)}/markAsRead`,
	});
}

async function markTicketUnread({
	auth,
	orgId,
	ticketId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/${encodeURIComponent(ticketId)}/markAsUnRead`,
	});
}

async function listTicketPins({
	auth,
	orgId,
	ticketId,
	types,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	types?: string[];
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/pins`,
		query: { types },
	});
}

async function createTicketPin({
	auth,
	orgId,
	ticketId,
	entityId,
	type,
	isPublic,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	entityId: string;
	type: string;
	isPublic?: boolean;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/${encodeURIComponent(ticketId)}/pins`,
		body: { entityId, type, isPublic },
	});
}

async function unpinTicketPin({
	auth,
	orgId,
	ticketId,
	pinIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	pinIds: string[];
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/${encodeURIComponent(ticketId)}/pins/unpin`,
		body: { ids: pinIds },
	});
}

async function listTicketApprovals({
	auth,
	orgId,
	ticketId,
	status,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	status?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/approvals`,
		query: { status, from, limit },
	});
}

async function createTicketApproval({
	auth,
	orgId,
	ticketId,
	approverIds,
	subject,
	description,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	approverIds: string[];
	subject: string;
	description?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/${encodeURIComponent(ticketId)}/approvals`,
		body: { approverIds, subject, description },
	});
}

async function getTicketApproval({
	auth,
	orgId,
	ticketId,
	approvalId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	approvalId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/approvals/${encodeURIComponent(approvalId)}`,
	});
}

async function updateTicketApproval({
	auth,
	orgId,
	ticketId,
	approvalId,
	status,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	approvalId: string;
	status: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PATCH,
		path: `/tickets/${encodeURIComponent(ticketId)}/approvals/${encodeURIComponent(approvalId)}`,
		body: { status },
	});
}

export const zohoDeskTicketsApi = {
	listTickets,
	createTicket,
	listTicketsByFilter,
	getTicket,
	updateTicket,
	searchTickets,
	deleteTickets,
	closeTickets,
	updateManyTickets,
	mergeTickets,
	moveTicket,
	listTicketHistory,
	getTicketMetrics,
	getTicketResolution,
	updateTicketResolution,
	deleteTicketResolution,
	countTickets,
	listTicketTags,
	addTicketTags,
	removeTicketTags,
	getSuggestedArticles,
	linkArticlesToTicket,
	markTicketsSpam,
	deleteSpamTickets,
	listTicketFollowers,
	addTicketFollowers,
	removeTicketFollowers,
	listTicketActivities,
	listTicketCalls,
	listTicketEvents,
	listTicketResolutionHistory,
	markTicketRead,
	markTicketUnread,
	listTicketPins,
	createTicketPin,
	unpinTicketPin,
	listTicketApprovals,
	createTicketApproval,
	getTicketApproval,
	updateTicketApproval,
};

type CreateTicketParams = {
	orgId: string;
	departmentId: string;
	subject: string;
	description: string;
	contactId?: string;
	email?: string;
	phone?: string;
	status?: string;
	priority?: string;
	category?: string;
	subCategory?: string;
	dueDate?: string;
	channel?: string;
	assigneeId?: string;
	productId?: string;
	classification?: string;
	language?: string;
	entitySkills?: unknown[];
	customFields?: Record<string, unknown>;
};
