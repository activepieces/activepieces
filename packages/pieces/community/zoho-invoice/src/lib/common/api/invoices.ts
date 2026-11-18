import { HttpMethod } from '@activepieces/pieces-common';

import { zohoInvoiceClient } from '../client';
import { zohoInvoiceUtils } from '../utils';

import type {
	ZohoInvoiceAuthValue,
	ZohoInvoiceInvoice,
	ZohoInvoiceListInvoicesResponse,
	ZohoInvoiceOrgScope,
	ZohoInvoiceResponse,
} from '../types';

async function listInvoices({
	auth,
	lastModifiedAt,
}: {
	auth: ZohoInvoiceAuthValue;
	lastModifiedAt?: string;
}): Promise<ZohoInvoiceInvoice[]> {
	const query: { last_modified_at?: string } = {};
	if (lastModifiedAt) query.last_modified_at = lastModifiedAt;
	const response = await zohoInvoiceClient.request<ZohoInvoiceListInvoicesResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/invoices',
		query,
	});
	return response.invoices ?? [];
}

async function searchInvoices({
	auth,
	organizationId,
	status,
	customerId,
	searchText,
	invoiceNumber,
	dateStart,
	dateEnd,
	sortColumn,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	status?: string;
	customerId?: string;
	searchText?: string;
	invoiceNumber?: string;
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
		path: '/invoices',
		query: zohoInvoiceUtils.toQuery({
			status,
			customer_id: customerId,
			search_text: searchText,
			invoice_number: invoiceNumber,
			date_start: dateStart,
			date_end: dateEnd,
			sort_column: sortColumn,
			page,
			per_page: perPage,
		}),
	});
}

async function getInvoice({
	auth,
	organizationId,
	invoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
}): Promise<ZohoInvoiceInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/invoices/${invoiceId}`,
	});
}

async function createInvoice({
	auth,
	organizationId,
	send,
	ignoreAutoNumberGeneration,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	send?: boolean;
	ignoreAutoNumberGeneration?: boolean;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: '/invoices',
		query: zohoInvoiceUtils.toQuery({
			send,
			ignore_auto_number_generation: ignoreAutoNumberGeneration,
		}),
		body,
	});
}

async function updateInvoice({
	auth,
	organizationId,
	invoiceId,
	ignoreAutoNumberGeneration,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
	ignoreAutoNumberGeneration?: boolean;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/invoices/${invoiceId}`,
		query: zohoInvoiceUtils.toQuery({
			ignore_auto_number_generation: ignoreAutoNumberGeneration,
		}),
		body,
	});
}

async function deleteInvoice({
	auth,
	organizationId,
	invoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/invoices/${invoiceId}`,
	});
}

async function emailInvoice({
	auth,
	organizationId,
	invoiceId,
	sendCustomerStatement,
	sendAttachment,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
	sendCustomerStatement?: boolean;
	sendAttachment?: boolean;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/invoices/${invoiceId}/email`,
		query: zohoInvoiceUtils.toQuery({
			send_customer_statement: sendCustomerStatement,
			send_attachment: sendAttachment,
		}),
		body,
	});
}

async function getInvoiceEmailContent({
	auth,
	organizationId,
	invoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/invoices/${invoiceId}/email`,
	});
}

async function markInvoiceSent({
	auth,
	organizationId,
	invoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/invoices/${invoiceId}/status/sent`,
	});
}

async function markInvoiceDraft({
	auth,
	organizationId,
	invoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/invoices/${invoiceId}/status/draft`,
	});
}

async function voidInvoice({
	auth,
	organizationId,
	invoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/invoices/${invoiceId}/status/void`,
	});
}

async function writeOffInvoice({
	auth,
	organizationId,
	invoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/invoices/${invoiceId}/writeoff`,
	});
}

async function cancelInvoiceWriteOff({
	auth,
	organizationId,
	invoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/invoices/${invoiceId}/writeoff/cancel`,
	});
}

async function sendInvoicePaymentReminder({
	auth,
	organizationId,
	invoiceId,
	sendCustomerStatement,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
	sendCustomerStatement?: boolean;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/invoices/${invoiceId}/paymentreminder`,
		query: zohoInvoiceUtils.toQuery({ send_customer_statement: sendCustomerStatement }),
		body,
	});
}

async function sendBulkInvoiceReminder({
	auth,
	organizationId,
	invoiceIds,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceIds: string[];
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: '/invoices/paymentreminder',
		query: zohoInvoiceUtils.toQuery({ invoice_ids: invoiceIds.join(',') }),
	});
}

async function getInvoicePaymentReminderContent({
	auth,
	organizationId,
	invoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/invoices/${invoiceId}/paymentreminder`,
	});
}

async function enableInvoicePaymentReminder({
	auth,
	organizationId,
	invoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/invoices/${invoiceId}/paymentreminder/enable`,
	});
}

async function disableInvoicePaymentReminder({
	auth,
	organizationId,
	invoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/invoices/${invoiceId}/paymentreminder/disable`,
	});
}

async function exportInvoicesPdf({
	auth,
	organizationId,
	invoiceIds,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceIds: string[];
}): Promise<ArrayBuffer> {
	return await zohoInvoiceClient.request<ArrayBuffer>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/invoices/pdf',
		headers: { Accept: 'application/pdf' },
		query: zohoInvoiceUtils.toQuery({ invoice_ids: invoiceIds.join(',') }),
		responseType: 'arraybuffer',
	});
}

async function listInvoiceTemplates({
	auth,
	organizationId,
}: ZohoInvoiceOrgScope & { auth: ZohoInvoiceAuthValue }): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/invoices/templates',
	});
}

async function setInvoiceTemplate({
	auth,
	organizationId,
	invoiceId,
	templateId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
	templateId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/invoices/${invoiceId}/templates/${templateId}`,
	});
}

async function updateInvoiceBillingAddress({
	auth,
	organizationId,
	invoiceId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/invoices/${invoiceId}/address/billing`,
		body,
	});
}

async function updateInvoiceShippingAddress({
	auth,
	organizationId,
	invoiceId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/invoices/${invoiceId}/address/shipping`,
		body,
	});
}

async function getInvoiceAttachment({
	auth,
	organizationId,
	invoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
}): Promise<ArrayBuffer> {
	return await zohoInvoiceClient.request<ArrayBuffer>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/invoices/${invoiceId}/attachment`,
		headers: { Accept: '*/*' },
		responseType: 'arraybuffer',
	});
}

async function addInvoiceAttachment({
	auth,
	organizationId,
	invoiceId,
	file,
	canSendInMail,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
	file: { filename: string; data: Buffer };
	canSendInMail?: boolean;
}): Promise<ZohoInvoiceResponse> {
	const form = new FormData();
	form.append('attachment', new Blob([new Uint8Array(file.data)]), file.filename);
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/invoices/${invoiceId}/attachment`,
		query: zohoInvoiceUtils.toQuery({ can_send_in_mail: canSendInMail }),
		body: form,
	});
}

async function deleteInvoiceAttachment({
	auth,
	organizationId,
	invoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/invoices/${invoiceId}/attachment`,
	});
}

async function listInvoiceComments({
	auth,
	organizationId,
	invoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/invoices/${invoiceId}/comments`,
	});
}

async function addInvoiceComment({
	auth,
	organizationId,
	invoiceId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/invoices/${invoiceId}/comments`,
		body,
	});
}

async function updateInvoiceComment({
	auth,
	organizationId,
	invoiceId,
	commentId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
	commentId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/invoices/${invoiceId}/comments/${commentId}`,
		body,
	});
}

async function deleteInvoiceComment({
	auth,
	organizationId,
	invoiceId,
	commentId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
	commentId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/invoices/${invoiceId}/comments/${commentId}`,
	});
}

async function applyCreditsToInvoice({
	auth,
	organizationId,
	invoiceId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/invoices/${invoiceId}/credits`,
		body,
	});
}

async function listInvoiceCreditsApplied({
	auth,
	organizationId,
	invoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/invoices/${invoiceId}/creditsapplied`,
	});
}

async function listInvoicePayments({
	auth,
	organizationId,
	invoiceId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/invoices/${invoiceId}/payments`,
	});
}

async function deleteInvoicePayment({
	auth,
	organizationId,
	invoiceId,
	invoicePaymentId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	invoiceId: string;
	invoicePaymentId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/invoices/${invoiceId}/payments/${invoicePaymentId}`,
	});
}

export const invoicesApi = {
	listInvoices,
	searchInvoices,
	getInvoice,
	createInvoice,
	updateInvoice,
	deleteInvoice,
	emailInvoice,
	getInvoiceEmailContent,
	markInvoiceSent,
	markInvoiceDraft,
	voidInvoice,
	writeOffInvoice,
	cancelInvoiceWriteOff,
	sendInvoicePaymentReminder,
	sendBulkInvoiceReminder,
	getInvoicePaymentReminderContent,
	enableInvoicePaymentReminder,
	disableInvoicePaymentReminder,
	exportInvoicesPdf,
	listInvoiceTemplates,
	setInvoiceTemplate,
	updateInvoiceBillingAddress,
	updateInvoiceShippingAddress,
	getInvoiceAttachment,
	addInvoiceAttachment,
	deleteInvoiceAttachment,
	listInvoiceComments,
	addInvoiceComment,
	updateInvoiceComment,
	deleteInvoiceComment,
	applyCreditsToInvoice,
	listInvoiceCreditsApplied,
	listInvoicePayments,
	deleteInvoicePayment,
};

export type ZohoInvoiceInvoiceResponse = ZohoInvoiceResponse & {
	invoice?: { customer_id?: string; line_items?: Record<string, unknown>[] };
};
