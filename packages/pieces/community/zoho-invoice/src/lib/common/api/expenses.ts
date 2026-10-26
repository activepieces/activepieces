import { HttpMethod } from '@activepieces/pieces-common';

import { zohoInvoiceClient } from '../client';
import { zohoInvoiceUtils } from '../utils';

import type { ZohoInvoiceAuthValue, ZohoInvoiceOrgScope, ZohoInvoiceResponse } from '../types';

async function createExpense({
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
		path: '/expenses',
		body,
	});
}

async function listExpenses({
	auth,
	organizationId,
	filterBy,
	searchText,
	dateStart,
	dateEnd,
	sortColumn,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	filterBy?: string;
	searchText?: string;
	dateStart?: string;
	dateEnd?: string;
	sortColumn?: string;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/expenses',
		query: zohoInvoiceUtils.toQuery({
			filter_by: filterBy,
			search_text: searchText,
			date_start: dateStart,
			date_end: dateEnd,
			sort_column: sortColumn,
			page,
			per_page: perPage,
		}),
	});
}

async function getExpense({
	auth,
	organizationId,
	expenseId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	expenseId: string;
}): Promise<ZohoInvoiceExpenseResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceExpenseResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/expenses/${expenseId}`,
	});
}

async function updateExpense({
	auth,
	organizationId,
	expenseId,
	deleteReceipt,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	expenseId: string;
	deleteReceipt?: boolean;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/expenses/${expenseId}`,
		query: zohoInvoiceUtils.toQuery({ delete_receipt: deleteReceipt }),
		body,
	});
}

async function deleteExpense({
	auth,
	organizationId,
	expenseId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	expenseId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/expenses/${expenseId}`,
	});
}

async function listExpenseHistory({
	auth,
	organizationId,
	expenseId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	expenseId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/expenses/${expenseId}/comments`,
	});
}

async function createExpenseCategory({
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
		path: '/expensecategories',
		body,
	});
}

async function listExpenseCategories({
	auth,
	organizationId,
	filterBy,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	filterBy?: string;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/expensecategories',
		query: zohoInvoiceUtils.toQuery({ filter_by: filterBy, page, per_page: perPage }),
	});
}

async function getExpenseCategory({
	auth,
	organizationId,
	expenseCategoryId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	expenseCategoryId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/expensecategories/${expenseCategoryId}`,
	});
}

async function updateExpenseCategory({
	auth,
	organizationId,
	expenseCategoryId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	expenseCategoryId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/expensecategories/${expenseCategoryId}`,
		body,
	});
}

async function deleteExpenseCategory({
	auth,
	organizationId,
	expenseCategoryId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	expenseCategoryId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/expensecategories/${expenseCategoryId}`,
	});
}

async function markExpenseCategoryActive({
	auth,
	organizationId,
	expenseCategoryId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	expenseCategoryId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/expensecategories/${expenseCategoryId}/active`,
	});
}

async function markExpenseCategoryInactive({
	auth,
	organizationId,
	expenseCategoryId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	expenseCategoryId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/expensecategories/${expenseCategoryId}/inactive`,
	});
}

export const expensesApi = {
	createExpense,
	listExpenses,
	getExpense,
	updateExpense,
	deleteExpense,
	listExpenseHistory,
	createExpenseCategory,
	listExpenseCategories,
	getExpenseCategory,
	updateExpenseCategory,
	deleteExpenseCategory,
	markExpenseCategoryActive,
	markExpenseCategoryInactive,
};

export type ZohoInvoiceExpenseResponse = ZohoInvoiceResponse & {
	expense?: { amount?: number; reference_number?: string };
};
