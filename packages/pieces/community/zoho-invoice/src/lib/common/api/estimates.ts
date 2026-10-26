import { HttpMethod } from '@activepieces/pieces-common';

import { zohoInvoiceClient } from '../client';
import { zohoInvoiceUtils } from '../utils';

import type { ZohoInvoiceAuthValue, ZohoInvoiceOrgScope, ZohoInvoiceResponse } from '../types';
import type { ZohoInvoiceDocumentLineItem } from './recurring-invoices';

async function createEstimate({
	auth,
	organizationId,
	ignoreAutoNumberGeneration,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	ignoreAutoNumberGeneration?: boolean;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: '/estimates',
		query: zohoInvoiceUtils.toQuery({
			ignore_auto_number_generation: ignoreAutoNumberGeneration,
		}),
		body,
	});
}

async function listEstimates({
	auth,
	organizationId,
	filterBy,
	searchText,
	customerId,
	sortColumn,
	sortOrder,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	filterBy?: string;
	searchText?: string;
	customerId?: string;
	sortColumn?: string;
	sortOrder?: string;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/estimates',
		query: zohoInvoiceUtils.toQuery({
			filter_by: filterBy,
			search_text: searchText,
			customer_id: customerId,
			sort_column: sortColumn,
			sort_order: sortOrder,
			page,
			per_page: perPage,
		}),
	});
}

async function getEstimate({
	auth,
	organizationId,
	estimateId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	estimateId: string;
}): Promise<ZohoInvoiceEstimateResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceEstimateResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/estimates/${estimateId}`,
	});
}

async function updateEstimate({
	auth,
	organizationId,
	estimateId,
	ignoreAutoNumberGeneration,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	estimateId: string;
	ignoreAutoNumberGeneration?: boolean;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/estimates/${estimateId}`,
		query: zohoInvoiceUtils.toQuery({
			ignore_auto_number_generation: ignoreAutoNumberGeneration,
		}),
		body,
	});
}

async function deleteEstimate({
	auth,
	organizationId,
	estimateId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	estimateId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/estimates/${estimateId}`,
	});
}

async function emailEstimate({
	auth,
	organizationId,
	estimateId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	estimateId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/estimates/${estimateId}/email`,
		body,
	});
}

async function emailMultipleEstimates({
	auth,
	organizationId,
	estimateIds,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	estimateIds: string[];
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: '/estimates/email',
		query: zohoInvoiceUtils.toQuery({ estimate_ids: estimateIds.join(',') }),
	});
}

async function getEstimateEmailContent({
	auth,
	organizationId,
	estimateId,
	emailTemplateId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	estimateId: string;
	emailTemplateId?: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/estimates/${estimateId}/email`,
		query: zohoInvoiceUtils.toQuery({ email_template_id: emailTemplateId }),
	});
}

async function markEstimateSent({
	auth,
	organizationId,
	estimateId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	estimateId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/estimates/${estimateId}/status/sent`,
	});
}

async function markEstimateAccepted({
	auth,
	organizationId,
	estimateId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	estimateId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/estimates/${estimateId}/status/accepted`,
	});
}

async function markEstimateDeclined({
	auth,
	organizationId,
	estimateId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	estimateId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/estimates/${estimateId}/status/declined`,
	});
}

async function listEstimateComments({
	auth,
	organizationId,
	estimateId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	estimateId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/estimates/${estimateId}/comments`,
	});
}

async function addEstimateComment({
	auth,
	organizationId,
	estimateId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	estimateId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/estimates/${estimateId}/comments`,
		body,
	});
}

async function updateEstimateComment({
	auth,
	organizationId,
	estimateId,
	commentId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	estimateId: string;
	commentId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/estimates/${estimateId}/comments/${commentId}`,
		body,
	});
}

async function deleteEstimateComment({
	auth,
	organizationId,
	estimateId,
	commentId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	estimateId: string;
	commentId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/estimates/${estimateId}/comments/${commentId}`,
	});
}

async function updateEstimateBillingAddress({
	auth,
	organizationId,
	estimateId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	estimateId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/estimates/${estimateId}/address/billing`,
		body,
	});
}

async function updateEstimateShippingAddress({
	auth,
	organizationId,
	estimateId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	estimateId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/estimates/${estimateId}/address/shipping`,
		body,
	});
}

async function listEstimateTemplates({
	auth,
	organizationId,
}: ZohoInvoiceOrgScope & { auth: ZohoInvoiceAuthValue }): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/estimates/templates',
	});
}

async function setEstimateTemplate({
	auth,
	organizationId,
	estimateId,
	templateId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	estimateId: string;
	templateId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/estimates/${estimateId}/templates/${templateId}`,
	});
}

async function exportEstimatesPdf({
	auth,
	organizationId,
	estimateIds,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	estimateIds: string[];
}): Promise<ArrayBuffer> {
	return await zohoInvoiceClient.request<ArrayBuffer>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/estimates/pdf',
		headers: { Accept: 'application/pdf' },
		query: zohoInvoiceUtils.toQuery({ estimate_ids: estimateIds.join(',') }),
		responseType: 'arraybuffer',
	});
}

export const estimatesApi = {
	createEstimate,
	listEstimates,
	getEstimate,
	updateEstimate,
	deleteEstimate,
	emailEstimate,
	emailMultipleEstimates,
	getEstimateEmailContent,
	markEstimateSent,
	markEstimateAccepted,
	markEstimateDeclined,
	listEstimateComments,
	addEstimateComment,
	updateEstimateComment,
	deleteEstimateComment,
	updateEstimateBillingAddress,
	updateEstimateShippingAddress,
	listEstimateTemplates,
	setEstimateTemplate,
	exportEstimatesPdf,
};

export type ZohoInvoiceEstimateAddress = {
	address?: string;
	city?: string;
	state?: string;
	zip?: string;
	country?: string;
	fax?: string;
};

export type ZohoInvoiceEstimateResponse = ZohoInvoiceResponse & {
	estimate?: {
		customer_id?: string;
		line_items?: ZohoInvoiceDocumentLineItem[];
		billing_address?: ZohoInvoiceEstimateAddress;
		shipping_address?: ZohoInvoiceEstimateAddress;
	};
};
