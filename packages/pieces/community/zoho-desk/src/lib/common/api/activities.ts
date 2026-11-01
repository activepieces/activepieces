import { HttpMethod } from '@activepieces/pieces-common';

import { zohoDeskClient } from '../client';

import type {
	ZohoDeskAuthValue,
	ZohoDeskDownload,
	ZohoDeskFile,
	ZohoDeskRecord,
} from '../types';

async function updateActivity({
	auth,
	orgId,
	module,
	id,
	fields,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	module: 'calls' | 'events';
	id: string;
	fields: ActivityFields;
}): Promise<ZohoDeskRecord> {
	const { customFields, ...rest } = fields;
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PATCH,
		path: `/${module}/${encodeURIComponent(id)}`,
		body: { ...rest, cf: customFields },
	});
}

async function updateCall({
	auth,
	orgId,
	callId,
	...fields
}: ActivityFields & {
	auth: ZohoDeskAuthValue;
	orgId: string;
	callId: string;
}): Promise<ZohoDeskRecord> {
	return await updateActivity({ auth, orgId, module: 'calls', id: callId, fields });
}

async function updateEvent({
	auth,
	orgId,
	eventId,
	...fields
}: ActivityFields & {
	auth: ZohoDeskAuthValue;
	orgId: string;
	eventId: string;
}): Promise<ZohoDeskRecord> {
	return await updateActivity({ auth, orgId, module: 'events', id: eventId, fields });
}

async function listCalls({
	auth,
	orgId,
	departmentId,
	viewId,
	assignee,
	isCompleted,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	departmentId?: string;
	viewId?: string;
	assignee?: string[];
	isCompleted?: boolean;
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/calls`,
		query: { departmentId, viewId, assignee, isCompleted, sortBy, from, limit },
	});
}

async function searchCalls({
	auth,
	orgId,
	searchText,
	subject,
	ticketNumber,
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
	subject?: string;
	ticketNumber?: string;
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
		path: `/calls/search`,
		query: {
			_all: searchText,
			subject,
			ticketNumber,
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

async function getCall({
	auth,
	orgId,
	callId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	callId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/calls/${encodeURIComponent(callId)}`,
	});
}

async function createCall({
	auth,
	orgId,
	subject,
	contactId,
	departmentId,
	ticketId,
	startTime,
	status,
	direction,
	duration,
	ownerId,
	priority,
	description,
	customFields,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	subject: string;
	contactId: string;
	departmentId: string;
	ticketId: string;
	startTime: string;
	status: string;
	direction: string;
	duration: number;
	ownerId: string;
	priority: string;
	description?: string;
	customFields?: Record<string, unknown>;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/calls`,
		body: {
			subject,
			contactId,
			departmentId,
			ticketId,
			startTime,
			status,
			direction,
			duration,
			ownerId,
			priority,
			description,
			cf: customFields,
		},
	});
}

async function deleteCalls({
	auth,
	orgId,
	callIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	callIds: string[];
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/calls/moveToTrash`,
		body: { entityIds: callIds },
	});
}

async function updateManyCalls({
	auth,
	orgId,
	callIds,
	fieldName,
	fieldValue,
	isCustomField,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	callIds: string[];
	fieldName: string;
	fieldValue?: string;
	isCustomField?: boolean;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/calls/updateMany`,
		body: { ids: callIds, fieldName, fieldValue, isCustomField },
	});
}

async function uploadCallAttachment({
	auth,
	orgId,
	callId,
	file,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	callId: string;
	file: ZohoDeskFile;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.upload<ZohoDeskRecord>({
		auth,
		orgId,
		path: `/calls/${encodeURIComponent(callId)}/attachments`,
		file,
	});
}

async function deleteCallAttachment({
	auth,
	orgId,
	callId,
	attachmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	callId: string;
	attachmentId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.DELETE,
		path: `/calls/${encodeURIComponent(callId)}/attachments/${encodeURIComponent(attachmentId)}`,
	});
}

async function listCallComments({
	auth,
	orgId,
	callId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	callId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/calls/${encodeURIComponent(callId)}/comments`,
		query: { from, limit },
	});
}

async function getCallComment({
	auth,
	orgId,
	callId,
	commentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	callId: string;
	commentId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/calls/${encodeURIComponent(callId)}/comments/${encodeURIComponent(commentId)}`,
	});
}

async function createCallComment({
	auth,
	orgId,
	callId,
	content,
	contentType,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	callId: string;
	content: string;
	contentType?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/calls/${encodeURIComponent(callId)}/comments`,
		body: { content, contentType },
	});
}

async function updateCallComment({
	auth,
	orgId,
	callId,
	commentId,
	content,
	contentType,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	callId: string;
	commentId: string;
	content: string;
	contentType?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PATCH,
		path: `/calls/${encodeURIComponent(callId)}/comments/${encodeURIComponent(commentId)}`,
		body: { content, contentType },
	});
}

async function deleteCallComment({
	auth,
	orgId,
	callId,
	commentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	callId: string;
	commentId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.DELETE,
		path: `/calls/${encodeURIComponent(callId)}/comments/${encodeURIComponent(commentId)}`,
	});
}

async function listEvents({
	auth,
	orgId,
	departmentId,
	viewId,
	assignee,
	isCompleted,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	departmentId?: string;
	viewId?: string;
	assignee?: string[];
	isCompleted?: boolean;
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/events`,
		query: { departmentId, viewId, assignee, isCompleted, sortBy, from, limit },
	});
}

async function searchEvents({
	auth,
	orgId,
	searchText,
	subject,
	ticketNumber,
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
	subject?: string;
	ticketNumber?: string;
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
		path: `/events/search`,
		query: {
			_all: searchText,
			subject,
			ticketNumber,
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

async function getEvent({
	auth,
	orgId,
	eventId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	eventId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/events/${encodeURIComponent(eventId)}`,
	});
}

async function createEvent({
	auth,
	orgId,
	subject,
	contactId,
	departmentId,
	ticketId,
	startTime,
	status,
	category,
	duration,
	ownerId,
	priority,
	description,
	customFields,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	subject: string;
	contactId: string;
	departmentId: string;
	ticketId?: string;
	startTime: string;
	status?: string;
	category?: string;
	duration: number;
	ownerId?: string;
	priority?: string;
	description?: string;
	customFields?: Record<string, unknown>;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/events`,
		body: {
			subject,
			contactId,
			departmentId,
			ticketId,
			startTime,
			status,
			category,
			duration,
			ownerId,
			priority,
			description,
			cf: customFields,
		},
	});
}

async function deleteEvents({
	auth,
	orgId,
	eventIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	eventIds: string[];
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/events/moveToTrash`,
		body: { entityIds: eventIds },
	});
}

async function updateManyEvents({
	auth,
	orgId,
	eventIds,
	fieldName,
	fieldValue,
	isCustomField,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	eventIds: string[];
	fieldName: string;
	fieldValue?: string;
	isCustomField?: boolean;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/events/updateMany`,
		body: { ids: eventIds, fieldName, fieldValue, isCustomField },
	});
}

async function listEventAttachments({
	auth,
	orgId,
	eventId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	eventId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/events/${encodeURIComponent(eventId)}/attachments`,
		query: { from, limit },
	});
}

async function uploadEventAttachment({
	auth,
	orgId,
	eventId,
	file,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	eventId: string;
	file: ZohoDeskFile;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.upload<ZohoDeskRecord>({
		auth,
		orgId,
		path: `/events/${encodeURIComponent(eventId)}/attachments`,
		file,
	});
}

async function deleteEventAttachment({
	auth,
	orgId,
	eventId,
	attachmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	eventId: string;
	attachmentId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.DELETE,
		path: `/events/${encodeURIComponent(eventId)}/attachments/${encodeURIComponent(attachmentId)}`,
	});
}

async function downloadEventAttachment({
	auth,
	orgId,
	eventId,
	attachmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	eventId: string;
	attachmentId: string;
}): Promise<ZohoDeskDownload> {
	return await zohoDeskClient.download({
		auth,
		orgId,
		path: `/events/${encodeURIComponent(eventId)}/attachments/${encodeURIComponent(
			attachmentId,
		)}/content`,
	});
}

async function listEventComments({
	auth,
	orgId,
	eventId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	eventId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/events/${encodeURIComponent(eventId)}/comments`,
		query: { from, limit },
	});
}

async function getEventComment({
	auth,
	orgId,
	eventId,
	commentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	eventId: string;
	commentId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/events/${encodeURIComponent(eventId)}/comments/${encodeURIComponent(commentId)}`,
	});
}

async function createEventComment({
	auth,
	orgId,
	eventId,
	content,
	contentType,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	eventId: string;
	content: string;
	contentType?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/events/${encodeURIComponent(eventId)}/comments`,
		body: { content, contentType },
	});
}

async function updateEventComment({
	auth,
	orgId,
	eventId,
	commentId,
	content,
	contentType,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	eventId: string;
	commentId: string;
	content: string;
	contentType?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PUT,
		path: `/events/${encodeURIComponent(eventId)}/comments/${encodeURIComponent(commentId)}`,
		body: { content, contentType },
	});
}

async function searchActivities({
	auth,
	orgId,
	searchText,
	subject,
	ticketNumber,
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
	subject?: string;
	ticketNumber?: string;
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
		path: `/activities/search`,
		query: {
			_all: searchText,
			subject,
			ticketNumber,
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

export const zohoDeskActivitiesApi = {
	updateCall,
	updateEvent,
	listCalls,
	searchCalls,
	getCall,
	createCall,
	deleteCalls,
	updateManyCalls,
	uploadCallAttachment,
	deleteCallAttachment,
	listCallComments,
	getCallComment,
	createCallComment,
	updateCallComment,
	deleteCallComment,
	listEvents,
	searchEvents,
	getEvent,
	createEvent,
	deleteEvents,
	updateManyEvents,
	listEventAttachments,
	uploadEventAttachment,
	deleteEventAttachment,
	downloadEventAttachment,
	listEventComments,
	getEventComment,
	createEventComment,
	updateEventComment,
	searchActivities,
};

type ActivityFields = {
	subject?: string;
	contactId?: string;
	departmentId?: string;
	ticketId?: string;
	startTime?: string;
	status?: string;
	duration?: number;
	ownerId?: string;
	priority?: string;
	category?: string;
	direction?: string;
	description?: string;
	customFields?: Record<string, unknown>;
};
