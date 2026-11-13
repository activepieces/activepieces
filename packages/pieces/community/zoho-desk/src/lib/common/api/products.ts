import { HttpMethod } from '@activepieces/pieces-common';

import { zohoDeskClient } from '../client';

import type { ZohoDeskAuthValue, ZohoDeskFile, ZohoDeskRecord } from '../types';

async function listProducts({
	auth,
	orgId,
	departmentId,
	viewId,
	ownerId,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	departmentId?: string;
	viewId?: string;
	ownerId?: string;
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/products`,
		query: { departmentId, viewId, ownerId, sortBy, from, limit },
	});
}

async function getProduct({
	auth,
	orgId,
	productId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	productId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/products/${encodeURIComponent(productId)}`,
	});
}

async function searchProducts({
	auth,
	orgId,
	searchText,
	productName,
	departmentId,
	contactId,
	accountId,
	createdTimeRange,
	modifiedTimeRange,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	searchText?: string;
	productName?: string;
	departmentId?: string;
	contactId?: string;
	accountId?: string;
	createdTimeRange?: string;
	modifiedTimeRange?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/products/search`,
		query: {
			_all: searchText,
			productName,
			departmentId,
			contactId,
			accountId,
			createdTimeRange,
			modifiedTimeRange,
			from,
			limit,
		},
	});
}

async function findDuplicateProducts({
	auth,
	orgId,
	productName,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	productName: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/products/searchDuplicates`,
		query: { productName, from, limit },
	});
}

async function createProduct({
	auth,
	orgId,
	productName,
	departmentIds,
	productCode,
	unitPrice,
	productCategory,
	manufacturer,
	ownerId,
	description,
	customFields,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	productName: string;
	departmentIds: string[];
	productCode?: string;
	unitPrice?: number;
	productCategory?: string;
	manufacturer?: string;
	ownerId?: string;
	description?: string;
	customFields?: Record<string, unknown>;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/products`,
		body: {
			productName,
			departmentIds,
			productCode,
			unitPrice,
			productCategory,
			manufacturer,
			ownerId,
			description,
			cf: customFields,
		},
	});
}

async function updateProduct({
	auth,
	orgId,
	productId,
	productName,
	departmentIds,
	productCode,
	unitPrice,
	productCategory,
	manufacturer,
	ownerId,
	description,
	customFields,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	productId: string;
	productName?: string;
	departmentIds?: string[];
	productCode?: string;
	unitPrice?: number;
	productCategory?: string;
	manufacturer?: string;
	ownerId?: string;
	description?: string;
	customFields?: Record<string, unknown>;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PATCH,
		path: `/products/${encodeURIComponent(productId)}`,
		body: {
			productName,
			departmentIds,
			productCode,
			unitPrice,
			productCategory,
			manufacturer,
			ownerId,
			description,
			cf: customFields,
		},
	});
}

async function deleteProducts({
	auth,
	orgId,
	productIds,
	departmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	productIds: string[];
	departmentId?: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/products/moveToTrash`,
		body: { productIds, departmentId },
	});
}

async function listProductAccounts({
	auth,
	orgId,
	productId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	productId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/products/${encodeURIComponent(productId)}/accounts`,
		query: { from, limit },
	});
}

async function listProductContacts({
	auth,
	orgId,
	productId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	productId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/products/${encodeURIComponent(productId)}/contacts`,
		query: { from, limit },
	});
}

async function listProductTickets({
	auth,
	orgId,
	productId,
	departmentId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	productId: string;
	departmentId?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/products/${encodeURIComponent(productId)}/tickets`,
		query: { departmentId, from, limit },
	});
}

async function associateProductAccounts({
	auth,
	orgId,
	productId,
	accountIds,
	associate,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	productId: string;
	accountIds: string[];
	associate: boolean;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/products/${encodeURIComponent(productId)}/associateAccounts`,
		body: { ids: accountIds, associate },
	});
}

async function associateProductContacts({
	auth,
	orgId,
	productId,
	contactIds,
	associate,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	productId: string;
	contactIds: string[];
	associate: boolean;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/products/${encodeURIComponent(productId)}/associateContacts`,
		body: { ids: contactIds, associate },
	});
}

async function listProductAttachments({
	auth,
	orgId,
	productId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	productId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/products/${encodeURIComponent(productId)}/attachments`,
		query: { from, limit },
	});
}

async function uploadProductAttachment({
	auth,
	orgId,
	productId,
	file,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	productId: string;
	file: ZohoDeskFile;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.upload<ZohoDeskRecord>({
		auth,
		orgId,
		path: `/products/${encodeURIComponent(productId)}/attachments`,
		file,
	});
}

async function deleteProductAttachment({
	auth,
	orgId,
	productId,
	attachmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	productId: string;
	attachmentId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.DELETE,
		path: `/products/${encodeURIComponent(productId)}/attachments/${encodeURIComponent(
			attachmentId,
		)}`,
	});
}

export const zohoDeskProductsApi = {
	listProducts,
	getProduct,
	searchProducts,
	findDuplicateProducts,
	createProduct,
	updateProduct,
	deleteProducts,
	listProductAccounts,
	listProductContacts,
	listProductTickets,
	associateProductAccounts,
	associateProductContacts,
	listProductAttachments,
	uploadProductAttachment,
	deleteProductAttachment,
};
