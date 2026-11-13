import { HttpMethod } from '@activepieces/pieces-common';

import { zohoInvoiceClient } from '../client';
import { zohoInvoiceUtils } from '../utils';

import type { ZohoInvoiceAuthValue, ZohoInvoiceOrgScope, ZohoInvoiceResponse } from '../types';

async function createItem({
	auth,
	organizationId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: '/items',
		body,
	});
}

async function listItems({
	auth,
	organizationId,
	filterBy,
	searchText,
	sortColumn,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	filterBy?: string;
	searchText?: string;
	sortColumn?: string;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/items',
		query: zohoInvoiceUtils.toQuery({
			filter_by: filterBy,
			search_text: searchText,
			sort_column: sortColumn,
			page,
			per_page: perPage,
		}),
	});
}

async function getItem({
	auth,
	organizationId,
	itemId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	itemId: string;
}): Promise<ZohoInvoiceItemResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceItemResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/items/${itemId}`,
	});
}

async function updateItem({
	auth,
	organizationId,
	itemId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	itemId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/items/${itemId}`,
		body,
	});
}

async function deleteItem({
	auth,
	organizationId,
	itemId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	itemId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/items/${itemId}`,
	});
}

async function markItemActive({
	auth,
	organizationId,
	itemId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	itemId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/items/${itemId}/active`,
	});
}

async function markItemInactive({
	auth,
	organizationId,
	itemId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	itemId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/items/${itemId}/inactive`,
	});
}

export const itemsApi = {
	createItem,
	listItems,
	getItem,
	updateItem,
	deleteItem,
	markItemActive,
	markItemInactive,
};

export type ZohoInvoiceItemResponse = ZohoInvoiceResponse & {
	item?: { name?: string; rate?: number };
};
