import { HttpMethod } from '@activepieces/pieces-common';

import { zohoDeskClient } from '../client';

import type { ZohoDeskAuthValue, ZohoDeskDownload, ZohoDeskRecord, ZohoDeskThread } from '../types';

async function listTicketThreads({
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
		path: `/tickets/${encodeURIComponent(ticketId)}/threads`,
		query: { from, limit },
	});
}

async function getTicketThread({
	auth,
	orgId,
	ticketId,
	threadId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	threadId: string;
}): Promise<ZohoDeskThread> {
	const path = `/tickets/${encodeURIComponent(ticketId)}/threads/${encodeURIComponent(threadId)}`;
	const thread = await zohoDeskClient.request<ZohoDeskThread>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path,
		query: { include: 'plainText' },
	});
	if (thread.isContentTruncated !== true) {
		return thread;
	}
	return await zohoDeskClient.request<ZohoDeskThread>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `${path}/fullContent`,
	});
}

async function getLatestTicketThread({
	auth,
	orgId,
	ticketId,
	needPublic,
	needIncomingThread,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	needPublic?: boolean;
	needIncomingThread?: boolean;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/latestThread`,
		query: { needPublic, needIncomingThread },
	});
}

async function listTicketConversations({
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
		path: `/tickets/${encodeURIComponent(ticketId)}/conversations`,
		query: { from, limit },
	});
}

async function listReplyAddresses({
	auth,
	orgId,
	departmentId,
	isActive,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	departmentId: string;
	isActive?: boolean;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/mailReplyAddress`,
		query: { departmentId, isActive, from, limit },
	});
}

async function sendTicketReply({
	auth,
	orgId,
	ticketId,
	content,
	fromEmailAddress,
	to,
	cc,
	bcc,
	contentType,
	inReplyToThreadId,
	ticketStatus,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	content: string;
	fromEmailAddress: string;
	to?: string;
	cc?: string;
	bcc?: string;
	contentType?: string;
	inReplyToThreadId?: string;
	ticketStatus?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/${encodeURIComponent(ticketId)}/sendReply`,
		body: {
			channel: 'EMAIL',
			content,
			fromEmailAddress,
			to,
			cc,
			bcc,
			contentType,
			inReplyToThreadId,
			ticketStatus,
		},
	});
}

async function createDraftReply({
	auth,
	orgId,
	ticketId,
	content,
	fromEmailAddress,
	to,
	cc,
	bcc,
	contentType,
	inReplyToThreadId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	content: string;
	fromEmailAddress: string;
	to?: string;
	cc?: string;
	bcc?: string;
	contentType?: string;
	inReplyToThreadId?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/${encodeURIComponent(ticketId)}/draftReply`,
		body: {
			channel: 'EMAIL',
			content,
			fromEmailAddress,
			to,
			cc,
			bcc,
			contentType,
			inReplyToThreadId,
		},
	});
}

async function downloadThreadAttachment({
	auth,
	orgId,
	ticketId,
	threadId,
	attachmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	threadId: string;
	attachmentId: string;
}): Promise<ZohoDeskDownload> {
	return await zohoDeskClient.download({
		auth,
		orgId,
		path: `/tickets/${encodeURIComponent(ticketId)}/threads/${encodeURIComponent(
			threadId,
		)}/attachments/${encodeURIComponent(attachmentId)}/content`,
	});
}

export const zohoDeskThreadsApi = {
	listTicketThreads,
	getTicketThread,
	getLatestTicketThread,
	listTicketConversations,
	listReplyAddresses,
	sendTicketReply,
	createDraftReply,
	downloadThreadAttachment,
};
