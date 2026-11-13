import { HttpMethod } from '@activepieces/pieces-common';

import { zohoInvoiceClient } from '../client';
import { zohoInvoiceUtils } from '../utils';

import type { ZohoInvoiceAuthValue, ZohoInvoiceOrgScope, ZohoInvoiceResponse } from '../types';

async function createRecurringInvoice({
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
		path: '/recurringinvoices',
		body,
	});
}

async function listRecurringInvoices({
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
		path: '/recurringinvoices',
		query: zohoInvoiceUtils.toQuery({
			filter_by: filterBy,
			search_text: searchText,
			sort_column: sortColumn,
			page,
			per_page: perPage,
		}),
	});
}

async function getRecurringInvoice({
	auth,
	organizationId,
	recurringInvoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	recurringInvoiceId: string;
}): Promise<ZohoInvoiceRecurringInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceRecurringInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/recurringinvoices/${recurringInvoiceId}`,
	});
}

async function updateRecurringInvoice({
	auth,
	organizationId,
	recurringInvoiceId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	recurringInvoiceId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/recurringinvoices/${recurringInvoiceId}`,
		body,
	});
}

async function deleteRecurringInvoice({
	auth,
	organizationId,
	recurringInvoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	recurringInvoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/recurringinvoices/${recurringInvoiceId}`,
	});
}

async function stopRecurringInvoice({
	auth,
	organizationId,
	recurringInvoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	recurringInvoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/recurringinvoices/${recurringInvoiceId}/status/stop`,
	});
}

async function resumeRecurringInvoice({
	auth,
	organizationId,
	recurringInvoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	recurringInvoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/recurringinvoices/${recurringInvoiceId}/status/resume`,
	});
}

async function listRecurringInvoiceHistory({
	auth,
	organizationId,
	recurringInvoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	recurringInvoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/recurringinvoices/${recurringInvoiceId}/comments`,
	});
}

export const recurringInvoicesApi = {
	createRecurringInvoice,
	listRecurringInvoices,
	getRecurringInvoice,
	updateRecurringInvoice,
	deleteRecurringInvoice,
	stopRecurringInvoice,
	resumeRecurringInvoice,
	listRecurringInvoiceHistory,
};

export type ZohoInvoiceDocumentLineItem = {
	line_item_id?: string;
	item_id?: string;
	name?: string;
	description?: string;
	rate?: number;
	quantity?: number;
	discount?: number | string;
	tax_id?: string;
};

export type ZohoInvoiceRecurringInvoiceResponse = ZohoInvoiceResponse & {
	recurring_invoice?: {
		recurrence_name?: string;
		customer_id?: string;
		recurrence_frequency?: string;
		repeat_every?: number | string;
		line_items?: ZohoInvoiceDocumentLineItem[];
	};
};
