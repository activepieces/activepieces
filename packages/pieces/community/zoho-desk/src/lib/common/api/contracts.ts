import { HttpMethod } from '@activepieces/pieces-common';

import { zohoDeskClient } from '../client';

import type { ZohoDeskAuthValue, ZohoDeskDownload, ZohoDeskRecord } from '../types';

async function listContracts({
	auth,
	orgId,
	accountId,
	contractName,
	departmentIds,
	ownerIds,
	viewId,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId?: string;
	contractName?: string;
	departmentIds?: string[];
	ownerIds?: string[];
	viewId?: string;
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contracts`,
		query: { accountId, contractName, departmentIds, ownerIds, viewId, sortBy, from, limit },
	});
}

async function countContracts({
	auth,
	orgId,
	viewId,
	departmentId,
	ownerId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	viewId: string;
	departmentId: string;
	ownerId?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contracts/count`,
		query: { viewId, departmentId, ownerId },
	});
}

async function getContract({
	auth,
	orgId,
	contractId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contractId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contracts/${encodeURIComponent(contractId)}`,
	});
}

async function createContract({
	auth,
	orgId,
	contractName,
	accountId,
	departmentId,
	ownerId,
	associatedSupportPlanId,
	startDate,
	endDate,
	associatedSLAId,
	productId,
	contractNumber,
	description,
	customFields,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contractName: string;
	accountId: string;
	departmentId: string;
	ownerId: string;
	associatedSupportPlanId: string;
	startDate: string;
	endDate?: string;
	associatedSLAId?: string;
	productId?: string;
	contractNumber?: string;
	description?: string;
	customFields?: Record<string, unknown>;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contracts`,
		body: {
			contractName,
			accountId,
			departmentId,
			ownerId,
			associatedSupportPlanId,
			startDate,
			endDate,
			associatedSLAId,
			productId,
			contractNumber,
			description,
			cf: customFields,
		},
	});
}

async function updateContract({
	auth,
	orgId,
	contractId,
	contractName,
	accountId,
	departmentId,
	ownerId,
	associatedSupportPlanId,
	startDate,
	endDate,
	associatedSLAId,
	productId,
	contractNumber,
	description,
	customFields,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contractId: string;
	contractName?: string;
	accountId?: string;
	departmentId?: string;
	ownerId?: string;
	associatedSupportPlanId?: string;
	startDate?: string;
	endDate?: string;
	associatedSLAId?: string;
	productId?: string;
	contractNumber?: string;
	description?: string;
	customFields?: Record<string, unknown>;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PATCH,
		path: `/contracts/${encodeURIComponent(contractId)}`,
		body: {
			contractName,
			accountId,
			departmentId,
			ownerId,
			associatedSupportPlanId,
			startDate,
			endDate,
			associatedSLAId,
			productId,
			contractNumber,
			description,
			cf: customFields,
		},
	});
}

async function updateManyContracts({
	auth,
	orgId,
	contractIds,
	fieldName,
	fieldValue,
	isCustomField,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contractIds: string[];
	fieldName: string;
	fieldValue: string;
	isCustomField: boolean;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contracts/updateMany`,
		body: { ids: contractIds, fieldName, fieldValue, isCustomField },
	});
}

async function listContractComments({
	auth,
	orgId,
	contractId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contractId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contracts/${encodeURIComponent(contractId)}/comments`,
		query: { from, limit },
	});
}

async function getContractComment({
	auth,
	orgId,
	contractId,
	commentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contractId: string;
	commentId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contracts/${encodeURIComponent(contractId)}/comments/${encodeURIComponent(commentId)}`,
	});
}

async function createContractComment({
	auth,
	orgId,
	contractId,
	content,
	contentType,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contractId: string;
	content: string;
	contentType?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contracts/${encodeURIComponent(contractId)}/comments`,
		body: { content, contentType },
	});
}

async function updateContractComment({
	auth,
	orgId,
	contractId,
	commentId,
	content,
	contentType,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contractId: string;
	commentId: string;
	content: string;
	contentType?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PATCH,
		path: `/contracts/${encodeURIComponent(contractId)}/comments/${encodeURIComponent(commentId)}`,
		body: { content, contentType },
	});
}

async function deleteContractComment({
	auth,
	orgId,
	contractId,
	commentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contractId: string;
	commentId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.DELETE,
		path: `/contracts/${encodeURIComponent(contractId)}/comments/${encodeURIComponent(commentId)}`,
	});
}

async function downloadContractCommentAttachment({
	auth,
	orgId,
	contractId,
	commentId,
	attachmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contractId: string;
	commentId: string;
	attachmentId: string;
}): Promise<ZohoDeskDownload> {
	return await zohoDeskClient.download({
		auth,
		orgId,
		path: `/contracts/${encodeURIComponent(contractId)}/comments/${encodeURIComponent(
			commentId,
		)}/attachments/${encodeURIComponent(attachmentId)}/content`,
	});
}

async function listSupportPlans({
	auth,
	orgId,
	departmentId,
	status,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	departmentId: string;
	status?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/supportPlans`,
		query: { departmentId, status, from, limit },
	});
}

export const zohoDeskContractsApi = {
	listSupportPlans,
	listContracts,
	countContracts,
	getContract,
	createContract,
	updateContract,
	updateManyContracts,
	listContractComments,
	getContractComment,
	createContractComment,
	updateContractComment,
	deleteContractComment,
	downloadContractCommentAttachment,
};
