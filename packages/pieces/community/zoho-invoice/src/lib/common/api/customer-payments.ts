import { HttpMethod } from '@activepieces/pieces-common';

import { zohoInvoiceClient } from '../client';
import { zohoInvoiceUtils } from '../utils';

import type { ZohoInvoiceAuthValue, ZohoInvoiceOrgScope, ZohoInvoiceResponse } from '../types';

async function createCustomerPayment({
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
		path: '/customerpayments',
		body,
	});
}

async function listCustomerPayments({
	auth,
	organizationId,
	filterBy,
	date,
	searchText,
	sortColumn,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	filterBy?: string;
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
		path: '/customerpayments',
		query: zohoInvoiceUtils.toQuery({
			filter_by: filterBy,
			date,
			search_text: searchText,
			sort_column: sortColumn,
			page,
			per_page: perPage,
		}),
	});
}

async function getCustomerPayment({
	auth,
	organizationId,
	paymentId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	paymentId: string;
}): Promise<ZohoInvoiceCustomerPaymentResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceCustomerPaymentResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/customerpayments/${paymentId}`,
	});
}

async function updateCustomerPayment({
	auth,
	organizationId,
	paymentId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	paymentId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/customerpayments/${paymentId}`,
		body,
	});
}

async function deleteCustomerPayment({
	auth,
	organizationId,
	paymentId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	paymentId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/customerpayments/${paymentId}`,
	});
}

async function refundCustomerPayment({
	auth,
	organizationId,
	paymentId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	paymentId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/customerpayments/${paymentId}/refunds`,
		body,
	});
}

async function listCustomerPaymentRefunds({
	auth,
	organizationId,
	paymentId,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	paymentId: string;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/customerpayments/${paymentId}/refunds`,
		query: zohoInvoiceUtils.toQuery({ page, per_page: perPage }),
	});
}

async function getCustomerPaymentRefund({
	auth,
	organizationId,
	paymentId,
	refundId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	paymentId: string;
	refundId: string;
}): Promise<ZohoInvoiceCustomerPaymentRefundResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceCustomerPaymentRefundResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/customerpayments/${paymentId}/refunds/${refundId}`,
	});
}

async function updateCustomerPaymentRefund({
	auth,
	organizationId,
	paymentId,
	refundId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	paymentId: string;
	refundId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/customerpayments/${paymentId}/refunds/${refundId}`,
		body,
	});
}

async function deleteCustomerPaymentRefund({
	auth,
	organizationId,
	paymentId,
	refundId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	paymentId: string;
	refundId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/customerpayments/${paymentId}/refunds/${refundId}`,
	});
}

async function updateCustomerPaymentCustomFields({
	auth,
	organizationId,
	paymentId,
	customFields,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	paymentId: string;
	customFields: unknown[];
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/customerpayment/${paymentId}/customfields`,
		body: { custom_fields: customFields },
	});
}

export const customerPaymentsApi = {
	createCustomerPayment,
	listCustomerPayments,
	getCustomerPayment,
	updateCustomerPayment,
	deleteCustomerPayment,
	refundCustomerPayment,
	listCustomerPaymentRefunds,
	getCustomerPaymentRefund,
	updateCustomerPaymentRefund,
	deleteCustomerPaymentRefund,
	updateCustomerPaymentCustomFields,
};

export type ZohoInvoiceCustomerPaymentResponse = ZohoInvoiceResponse & {
	payment?: {
		customer_id?: string;
		payment_mode?: string;
		amount?: number;
		date?: string;
		invoices?: { invoice_id?: string; invoice_payment_id?: string; amount_applied?: number }[];
	};
};

export type ZohoInvoiceCustomerPaymentRefundResponse = ZohoInvoiceResponse & {
	payment_refunds?: { date?: string; amount?: number };
};
