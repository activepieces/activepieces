import { HttpMethod } from '@activepieces/pieces-common';

import { zohoDeskClient } from '../client';

import type { ZohoDeskAuthValue, ZohoDeskDownload, ZohoDeskFile, ZohoDeskRecord } from '../types';

async function listTasks({
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
		path: `/tasks`,
		query: { departmentId, viewId, assignee, isCompleted, sortBy, from, limit },
	});
}

async function listTicketTasks({
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
		path: `/tickets/${encodeURIComponent(ticketId)}/tasks`,
		query: { isCompleted, sortBy, from, limit },
	});
}

async function getTask({
	auth,
	orgId,
	taskId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tasks/${encodeURIComponent(taskId)}`,
	});
}

async function searchTasks({
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
	dueDateRange,
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
	dueDateRange?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tasks/search`,
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
			dueDateRange,
			from,
			limit,
		},
	});
}

async function countTasks({
	auth,
	orgId,
	viewId,
	departmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	viewId: string;
	departmentId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tasks/count`,
		query: { viewId, departmentId },
	});
}

async function createTask({
	auth,
	orgId,
	subject,
	departmentId,
	ticketId,
	contactId,
	ownerId,
	dueDate,
	status,
	priority,
	category,
	description,
	customFields,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	subject: string;
	departmentId: string;
	ticketId?: string;
	contactId?: string;
	ownerId?: string;
	dueDate?: string;
	status?: string;
	priority?: string;
	category?: string;
	description?: string;
	customFields?: Record<string, unknown>;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tasks`,
		body: {
			subject,
			departmentId,
			ticketId,
			contactId,
			ownerId,
			dueDate,
			status,
			priority,
			category,
			description,
			cf: customFields,
		},
	});
}

async function updateTask({
	auth,
	orgId,
	taskId,
	subject,
	departmentId,
	ticketId,
	contactId,
	ownerId,
	dueDate,
	status,
	priority,
	category,
	description,
	customFields,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
	subject?: string;
	departmentId?: string;
	ticketId?: string;
	contactId?: string;
	ownerId?: string;
	dueDate?: string;
	status?: string;
	priority?: string;
	category?: string;
	description?: string;
	customFields?: Record<string, unknown>;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PATCH,
		path: `/tasks/${encodeURIComponent(taskId)}`,
		body: {
			subject,
			departmentId,
			ticketId,
			contactId,
			ownerId,
			dueDate,
			status,
			priority,
			category,
			description,
			cf: customFields,
		},
	});
}

async function deleteTasks({
	auth,
	orgId,
	taskIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskIds: string[];
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tasks/moveToTrash`,
		body: { entityIds: taskIds },
	});
}

async function updateManyTasks({
	auth,
	orgId,
	taskIds,
	fieldName,
	fieldValue,
	isCustomField,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskIds: string[];
	fieldName: string;
	fieldValue?: string;
	isCustomField?: boolean;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tasks/updateMany`,
		body: { ids: taskIds, fieldName, fieldValue, isCustomField },
	});
}

async function listTaskComments({
	auth,
	orgId,
	taskId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tasks/${encodeURIComponent(taskId)}/comments`,
		query: { from, limit },
	});
}

async function getTaskComment({
	auth,
	orgId,
	taskId,
	commentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
	commentId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}`,
	});
}

async function createTaskComment({
	auth,
	orgId,
	taskId,
	content,
	contentType,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
	content: string;
	contentType?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tasks/${encodeURIComponent(taskId)}/comments`,
		body: { content, contentType },
	});
}

async function updateTaskComment({
	auth,
	orgId,
	taskId,
	commentId,
	content,
	contentType,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
	commentId: string;
	content: string;
	contentType?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PUT,
		path: `/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}`,
		body: { content, contentType },
	});
}

async function listTaskAttachments({
	auth,
	orgId,
	taskId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tasks/${encodeURIComponent(taskId)}/attachments`,
		query: { from, limit },
	});
}

async function uploadTaskAttachment({
	auth,
	orgId,
	taskId,
	file,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
	file: ZohoDeskFile;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.upload<ZohoDeskRecord>({
		auth,
		orgId,
		path: `/tasks/${encodeURIComponent(taskId)}/attachments`,
		file,
	});
}

async function deleteTaskAttachment({
	auth,
	orgId,
	taskId,
	attachmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
	attachmentId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.DELETE,
		path: `/tasks/${encodeURIComponent(taskId)}/attachments/${encodeURIComponent(attachmentId)}`,
	});
}

async function downloadTaskAttachment({
	auth,
	orgId,
	taskId,
	attachmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
	attachmentId: string;
}): Promise<ZohoDeskDownload> {
	return await zohoDeskClient.download({
		auth,
		orgId,
		path: `/tasks/${encodeURIComponent(taskId)}/attachments/${encodeURIComponent(
			attachmentId,
		)}/content`,
	});
}

export const zohoDeskTasksApi = {
	listTasks,
	listTicketTasks,
	getTask,
	searchTasks,
	countTasks,
	createTask,
	updateTask,
	deleteTasks,
	updateManyTasks,
	listTaskComments,
	getTaskComment,
	createTaskComment,
	updateTaskComment,
	listTaskAttachments,
	uploadTaskAttachment,
	deleteTaskAttachment,
	downloadTaskAttachment,
};
