import { HttpMethod } from '@activepieces/pieces-common';

import { zohoInvoiceClient } from '../client';
import { zohoInvoiceUtils } from '../utils';

import type { ZohoInvoiceAuthValue, ZohoInvoiceOrgScope, ZohoInvoiceResponse } from '../types';

async function createCreditNote({
	auth,
	organizationId,
	invoiceId,
	ignoreAutoNumberGeneration,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId?: string;
	ignoreAutoNumberGeneration?: boolean;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: '/creditnotes',
		query: zohoInvoiceUtils.toQuery({
			invoice_id: invoiceId,
			ignore_auto_number_generation: ignoreAutoNumberGeneration,
		}),
		body,
	});
}

async function listCreditNotes({
	auth,
	organizationId,
	filterBy,
	customerId,
	date,
	searchText,
	sortColumn,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	filterBy?: string;
	customerId?: string;
	date?: string;
	searchText?: string;
	sortColumn?: string;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/creditnotes',
		query: zohoInvoiceUtils.toQuery({
			filter_by: filterBy,
			customer_id: customerId,
			date,
			search_text: searchText,
			sort_column: sortColumn,
			page,
			per_page: perPage,
		}),
	});
}

async function getCreditNote({
	auth,
	organizationId,
	creditNoteId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
}): Promise<ZohoInvoiceCreditNoteResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceCreditNoteResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/creditnotes/${creditNoteId}`,
	});
}

async function updateCreditNote({
	auth,
	organizationId,
	creditNoteId,
	ignoreAutoNumberGeneration,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
	ignoreAutoNumberGeneration?: boolean;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/creditnotes/${creditNoteId}`,
		query: zohoInvoiceUtils.toQuery({
			ignore_auto_number_generation: ignoreAutoNumberGeneration,
		}),
		body,
	});
}

async function deleteCreditNote({
	auth,
	organizationId,
	creditNoteId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/creditnotes/${creditNoteId}`,
	});
}

async function voidCreditNote({
	auth,
	organizationId,
	creditNoteId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/creditnotes/${creditNoteId}/void`,
	});
}

async function reopenCreditNote({
	auth,
	organizationId,
	creditNoteId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/creditnotes/${creditNoteId}/status/open`,
	});
}

async function emailCreditNote({
	auth,
	organizationId,
	creditNoteId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/creditnotes/${creditNoteId}/email`,
		body,
	});
}

async function getCreditNoteEmailHistory({
	auth,
	organizationId,
	creditNoteId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/creditnotes/${creditNoteId}/emailhistory`,
	});
}

async function applyCreditNoteToInvoices({
	auth,
	organizationId,
	creditNoteId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/creditnotes/${creditNoteId}/invoices`,
		body,
	});
}

async function listCreditNoteInvoices({
	auth,
	organizationId,
	creditNoteId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/creditnotes/${creditNoteId}/invoices`,
	});
}

async function removeCreditNoteFromInvoice({
	auth,
	organizationId,
	creditNoteId,
	creditNoteInvoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
	creditNoteInvoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/creditnotes/${creditNoteId}/invoices/${creditNoteInvoiceId}`,
	});
}

async function refundCreditNote({
	auth,
	organizationId,
	creditNoteId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/creditnotes/${creditNoteId}/refunds`,
		body,
	});
}

async function listCreditNoteRefunds({
	auth,
	organizationId,
	creditNoteId,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/creditnotes/${creditNoteId}/refunds`,
		query: zohoInvoiceUtils.toQuery({ page, per_page: perPage }),
	});
}

async function listAllCreditNoteRefunds({
	auth,
	organizationId,
	customerId,
	sortColumn,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	customerId?: string;
	sortColumn?: string;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/creditnotes/refunds',
		query: zohoInvoiceUtils.toQuery({
			customer_id: customerId,
			sort_column: sortColumn,
			page,
			per_page: perPage,
		}),
	});
}

async function getCreditNoteRefund({
	auth,
	organizationId,
	creditNoteId,
	refundId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
	refundId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/creditnotes/${creditNoteId}/refunds/${refundId}`,
	});
}

async function updateCreditNoteRefund({
	auth,
	organizationId,
	creditNoteId,
	refundId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
	refundId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/creditnotes/${creditNoteId}/refunds/${refundId}`,
		body,
	});
}

async function deleteCreditNoteRefund({
	auth,
	organizationId,
	creditNoteId,
	refundId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
	refundId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/creditnotes/${creditNoteId}/refunds/${refundId}`,
	});
}

async function listCreditNoteComments({
	auth,
	organizationId,
	creditNoteId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/creditnotes/${creditNoteId}/comments`,
	});
}

async function addCreditNoteComment({
	auth,
	organizationId,
	creditNoteId,
	description,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
	description: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/creditnotes/${creditNoteId}/comments`,
		body: { description },
	});
}

async function deleteCreditNoteComment({
	auth,
	organizationId,
	creditNoteId,
	commentId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
	commentId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/creditnotes/${creditNoteId}/comments/${commentId}`,
	});
}

async function listCreditNoteTemplates({
	auth,
	organizationId,
}: ZohoInvoiceOrgScope & { auth: ZohoInvoiceAuthValue }): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/creditnotes/templates',
	});
}

async function setCreditNoteTemplate({
	auth,
	organizationId,
	creditNoteId,
	templateId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	creditNoteId: string;
	templateId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/creditnotes/${creditNoteId}/templates/${templateId}`,
	});
}

export const creditNotesApi = {
	createCreditNote,
	listCreditNotes,
	getCreditNote,
	updateCreditNote,
	deleteCreditNote,
	voidCreditNote,
	reopenCreditNote,
	emailCreditNote,
	getCreditNoteEmailHistory,
	applyCreditNoteToInvoices,
	listCreditNoteInvoices,
	removeCreditNoteFromInvoice,
	refundCreditNote,
	listCreditNoteRefunds,
	listAllCreditNoteRefunds,
	getCreditNoteRefund,
	updateCreditNoteRefund,
	deleteCreditNoteRefund,
	listCreditNoteComments,
	addCreditNoteComment,
	deleteCreditNoteComment,
	listCreditNoteTemplates,
	setCreditNoteTemplate,
};

export type ZohoInvoiceCreditNoteLineItem = {
	line_item_id?: string;
	item_id?: string;
	name?: string;
	description?: string;
	rate?: number;
	quantity?: number;
	discount?: number | string;
	tax_id?: string;
};

export type ZohoInvoiceCreditNoteResponse = ZohoInvoiceResponse & {
	creditnote?: {
		customer_id?: string;
		date?: string;
		creditnote_number?: string;
		line_items?: ZohoInvoiceCreditNoteLineItem[];
	};
};
