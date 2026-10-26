import { HttpMethod } from '@activepieces/pieces-common';

import { zohoDeskClient } from '../client';

import type { ZohoDeskAuthValue, ZohoDeskFile, ZohoDeskRecord } from '../types';

async function listTicketComments({
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
		path: `/tickets/${encodeURIComponent(ticketId)}/comments`,
		query: { from, limit },
	});
}

async function getTicketComment({
	auth,
	orgId,
	ticketId,
	commentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	commentId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/comments/${encodeURIComponent(commentId)}`,
	});
}

async function createTicketComment({
	auth,
	orgId,
	ticketId,
	content,
	isPublic,
	contentType,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	content: string;
	isPublic?: boolean;
	contentType?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/${encodeURIComponent(ticketId)}/comments`,
		body: { content, isPublic, contentType },
	});
}

async function updateTicketComment({
	auth,
	orgId,
	ticketId,
	commentId,
	content,
	isPublic,
	contentType,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	commentId: string;
	content: string;
	isPublic?: boolean;
	contentType?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PATCH,
		path: `/tickets/${encodeURIComponent(ticketId)}/comments/${encodeURIComponent(commentId)}`,
		body: { content, isPublic, contentType },
	});
}

async function deleteTicketComment({
	auth,
	orgId,
	ticketId,
	commentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	commentId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.DELETE,
		path: `/tickets/${encodeURIComponent(ticketId)}/comments/${encodeURIComponent(commentId)}`,
	});
}

async function getTicketCommentHistory({
	auth,
	orgId,
	ticketId,
	commentId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	commentId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/comments/${encodeURIComponent(
			commentId,
		)}/history`,
		query: { from, limit },
	});
}

async function listTicketAttachments({
	auth,
	orgId,
	ticketId,
	isPublic,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	isPublic?: boolean;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/attachments`,
		query: { isPublic, from, limit },
	});
}

async function uploadTicketAttachment({
	auth,
	orgId,
	ticketId,
	file,
	isPublic,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	file: ZohoDeskFile;
	isPublic?: boolean;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.upload<ZohoDeskRecord>({
		auth,
		orgId,
		path: `/tickets/${encodeURIComponent(ticketId)}/attachments`,
		query: { isPublic },
		file,
	});
}

async function deleteTicketAttachment({
	auth,
	orgId,
	ticketId,
	attachmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	attachmentId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.DELETE,
		path: `/tickets/${encodeURIComponent(ticketId)}/attachments/${encodeURIComponent(
			attachmentId,
		)}`,
	});
}

export const zohoDeskTicketCommentsApi = {
	listTicketComments,
	getTicketComment,
	createTicketComment,
	updateTicketComment,
	deleteTicketComment,
	getTicketCommentHistory,
	listTicketAttachments,
	uploadTicketAttachment,
	deleteTicketAttachment,
};
