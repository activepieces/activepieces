import { HttpMethod } from '@activepieces/pieces-common';

import { zohoDeskClient } from '../client';

import type { ZohoDeskAuthValue, ZohoDeskFile, ZohoDeskRecord } from '../types';

async function listAccounts({
	auth,
	orgId,
	viewId,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	viewId?: string;
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/accounts`,
		query: { viewId, sortBy, from, limit },
	});
}

async function getAccount({
	auth,
	orgId,
	accountId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/accounts/${encodeURIComponent(accountId)}`,
	});
}

async function createAccount({
	auth,
	orgId,
	accountName,
	email,
	phone,
	website,
	industry,
	ownerId,
	description,
	street,
	city,
	state,
	code,
	country,
	customFields,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountName: string;
	email?: string;
	phone?: string;
	website?: string;
	industry?: string;
	ownerId?: string;
	description?: string;
	street?: string;
	city?: string;
	state?: string;
	code?: string;
	country?: string;
	customFields?: Record<string, unknown>;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/accounts`,
		body: {
			accountName,
			email,
			phone,
			website,
			industry,
			ownerId,
			description,
			street,
			city,
			state,
			code,
			country,
			cf: customFields,
		},
	});
}

async function updateAccount({
	auth,
	orgId,
	accountId,
	accountName,
	email,
	phone,
	website,
	industry,
	ownerId,
	description,
	street,
	city,
	state,
	code,
	country,
	customFields,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	accountName?: string;
	email?: string;
	phone?: string;
	website?: string;
	industry?: string;
	ownerId?: string;
	description?: string;
	street?: string;
	city?: string;
	state?: string;
	code?: string;
	country?: string;
	customFields?: Record<string, unknown>;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PATCH,
		path: `/accounts/${encodeURIComponent(accountId)}`,
		body: {
			accountName,
			email,
			phone,
			website,
			industry,
			ownerId,
			description,
			street,
			city,
			state,
			code,
			country,
			cf: customFields,
		},
	});
}

async function deleteAccounts({
	auth,
	orgId,
	accountIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountIds: string[];
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/accounts/moveToTrash`,
		body: { accountIds },
	});
}

async function searchAccounts({
	auth,
	orgId,
	searchText,
	accountName,
	createdTimeRange,
	modifiedTimeRange,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	searchText?: string;
	accountName?: string;
	createdTimeRange?: string;
	modifiedTimeRange?: string;
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/accounts/search`,
		query: {
			_all: searchText,
			accountName,
			createdTimeRange,
			modifiedTimeRange,
			sortBy,
			from,
			limit,
		},
	});
}

async function countAccounts({
	auth,
	orgId,
	viewId,
	startsWith,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	viewId: string;
	startsWith?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/accounts/count`,
		query: { viewId, startsWith },
	});
}

async function updateManyAccounts({
	auth,
	orgId,
	accountIds,
	fieldName,
	fieldValue,
	isCustomField,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountIds: string[];
	fieldName: string;
	fieldValue?: string;
	isCustomField?: boolean;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/accounts/updateMany`,
		body: { ids: accountIds, fieldName, fieldValue, isCustomField },
	});
}

async function listAccountContacts({
	auth,
	orgId,
	accountId,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/accounts/${encodeURIComponent(accountId)}/contacts`,
		query: { sortBy, from, limit },
	});
}

async function listAccountTickets({
	auth,
	orgId,
	accountId,
	departmentId,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	departmentId?: string;
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/accounts/${encodeURIComponent(accountId)}/tickets`,
		query: { departmentId, sortBy, from, limit },
	});
}

async function listAccountProducts({
	auth,
	orgId,
	accountId,
	departmentId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	departmentId?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/accounts/${encodeURIComponent(accountId)}/products`,
		query: { departmentId, from, limit },
	});
}

async function listAccountContracts({
	auth,
	orgId,
	accountId,
	departmentId,
	contractStatus,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	departmentId?: string;
	contractStatus?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/accounts/${encodeURIComponent(accountId)}/contracts`,
		query: { departmentId, contractStatus, from, limit },
	});
}

async function listAccountSlas({
	auth,
	orgId,
	accountId,
	departmentId,
	status,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	departmentId?: string;
	status?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/accounts/${encodeURIComponent(accountId)}/sla`,
		query: { departmentId, status, from, limit },
	});
}

async function setAccountSla({
	auth,
	orgId,
	accountId,
	slaId,
	associate,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	slaId: string;
	associate: boolean;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/accounts/${encodeURIComponent(accountId)}/sla/${encodeURIComponent(slaId)}`,
		body: { associate },
	});
}

async function associateAccountProducts({
	auth,
	orgId,
	accountId,
	productIds,
	associate,
	departmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	productIds: string[];
	associate: boolean;
	departmentId?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/accounts/${encodeURIComponent(accountId)}/associateProducts`,
		body: { ids: productIds, associate, departmentId },
	});
}

async function listAccountAttachments({
	auth,
	orgId,
	accountId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/accounts/${encodeURIComponent(accountId)}/attachments`,
		query: { from, limit },
	});
}

async function uploadAccountAttachment({
	auth,
	orgId,
	accountId,
	file,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	file: ZohoDeskFile;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.upload<ZohoDeskRecord>({
		auth,
		orgId,
		path: `/accounts/${encodeURIComponent(accountId)}/attachments`,
		file,
	});
}

async function deleteAccountAttachment({
	auth,
	orgId,
	accountId,
	attachmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	attachmentId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.DELETE,
		path: `/accounts/${encodeURIComponent(accountId)}/attachments/${encodeURIComponent(
			attachmentId,
		)}`,
	});
}

async function listAccountComments({
	auth,
	orgId,
	accountId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/accounts/${encodeURIComponent(accountId)}/comments`,
		query: { from, limit },
	});
}

async function getAccountComment({
	auth,
	orgId,
	accountId,
	commentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	commentId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/accounts/${encodeURIComponent(accountId)}/comments/${encodeURIComponent(commentId)}`,
	});
}

async function createAccountComment({
	auth,
	orgId,
	accountId,
	content,
	contentType,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	content: string;
	contentType?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/accounts/${encodeURIComponent(accountId)}/comments`,
		body: { content, contentType },
	});
}

async function updateAccountComment({
	auth,
	orgId,
	accountId,
	commentId,
	content,
	contentType,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	commentId: string;
	content: string;
	contentType?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PUT,
		path: `/accounts/${encodeURIComponent(accountId)}/comments/${encodeURIComponent(commentId)}`,
		body: { content, contentType },
	});
}

async function deleteAccountComment({
	auth,
	orgId,
	accountId,
	commentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	commentId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.DELETE,
		path: `/accounts/${encodeURIComponent(accountId)}/comments/${encodeURIComponent(commentId)}`,
	});
}

async function listAccountFollowers({
	auth,
	orgId,
	accountId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/accounts/${encodeURIComponent(accountId)}/followers`,
		query: { from, limit },
	});
}

async function addAccountFollowers({
	auth,
	orgId,
	accountId,
	followerIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	followerIds: string[];
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/accounts/${encodeURIComponent(accountId)}/addFollowers`,
		body: { followerIds },
	});
}

async function removeAccountFollowers({
	auth,
	orgId,
	accountId,
	followerIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	followerIds: string[];
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/accounts/${encodeURIComponent(accountId)}/removeFollowers`,
		body: { followerIds },
	});
}

async function listAccountHistory({
	auth,
	orgId,
	accountId,
	contactId,
	agentId,
	departmentId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	contactId?: string;
	agentId?: string;
	departmentId?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/accounts/${encodeURIComponent(accountId)}/history`,
		query: { contactId, agentId, departmentId, from, limit },
	});
}

async function getAccountStatistics({
	auth,
	orgId,
	accountId,
	departmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	departmentId?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/accounts/${encodeURIComponent(accountId)}/statistics`,
		query: { departmentId },
	});
}

async function mergeAccounts({
	auth,
	orgId,
	accountId,
	accountIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	accountIds: string[];
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/accounts/${encodeURIComponent(accountId)}/merge`,
		body: { ids: accountIds },
	});
}

export const zohoDeskAccountsApi = {
	listAccounts,
	getAccount,
	createAccount,
	updateAccount,
	deleteAccounts,
	searchAccounts,
	countAccounts,
	updateManyAccounts,
	listAccountContacts,
	listAccountTickets,
	listAccountProducts,
	listAccountContracts,
	listAccountSlas,
	setAccountSla,
	associateAccountProducts,
	listAccountAttachments,
	uploadAccountAttachment,
	deleteAccountAttachment,
	listAccountComments,
	getAccountComment,
	createAccountComment,
	updateAccountComment,
	deleteAccountComment,
	listAccountFollowers,
	addAccountFollowers,
	removeAccountFollowers,
	listAccountHistory,
	getAccountStatistics,
	mergeAccounts,
};
