import { HttpMethod } from '@activepieces/pieces-common';

import { zohoInvoiceClient } from '../client';
import { zohoInvoiceUtils } from '../utils';

import type {
	ZohoInvoiceAuthValue,
	ZohoInvoiceOrgScope,
	ZohoInvoiceResponse,
	ZohoInvoiceUserResponse,
} from '../types';

async function listOrganizations({
	auth,
}: {
	auth: ZohoInvoiceAuthValue;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/organizations',
	});
}

async function getOrganization({
	auth,
	organizationId,
}: {
	auth: ZohoInvoiceAuthValue;
	organizationId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		method: HttpMethod.GET,
		path: `/organizations/${organizationId}`,
	});
}

async function listUsers({
	auth,
	organizationId,
	filterBy,
	sortColumn,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	filterBy?: string;
	sortColumn?: string;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/users',
		query: zohoInvoiceUtils.toQuery({
			filter_by: filterBy,
			sort_column: sortColumn,
			page,
			per_page: perPage,
		}),
	});
}

async function getCurrentUser({
	auth,
	organizationId,
}: ZohoInvoiceOrgScope & { auth: ZohoInvoiceAuthValue }): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/users/me',
	});
}

async function getUser({
	auth,
	organizationId,
	userId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	userId: string;
}): Promise<ZohoInvoiceUserResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceUserResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/users/${userId}`,
	});
}

async function updateUser({
	auth,
	organizationId,
	userId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	userId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/users/${userId}`,
		body,
	});
}

export const organizationsApi = {
	listOrganizations,
	getOrganization,
	listUsers,
	getCurrentUser,
	getUser,
	updateUser,
};
