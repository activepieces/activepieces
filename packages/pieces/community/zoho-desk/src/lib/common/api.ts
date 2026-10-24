import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';

import { zohoDeskClient } from './client';

import type {
	ZohoDeskAuthValue,
	ZohoDeskContact,
	ZohoDeskDepartment,
	ZohoDeskOrganization,
	ZohoDeskPage,
	ZohoDeskTicket,
} from './types';

async function listOrganizations({
	auth,
}: {
	auth: ZohoDeskAuthValue;
}): Promise<ZohoDeskOrganization[]> {
	const response = await zohoDeskClient.request<ZohoDeskPage<ZohoDeskOrganization>>({
		auth,
		method: HttpMethod.GET,
		path: '/organizations',
	});
	return response.data;
}

async function listDepartments({
	auth,
	orgId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
}): Promise<ZohoDeskDepartment[]> {
	const response = await zohoDeskClient.request<ZohoDeskPage<ZohoDeskDepartment>>({
		auth,
		method: HttpMethod.GET,
		path: '/departments',
		orgId,
	});
	return response.data;
}

async function listTickets({
	auth,
	orgId,
	include,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	include?: string[];
}): Promise<ZohoDeskPage<ZohoDeskTicket>> {
	const query: Record<string, string> = {};
	if (include) query['include'] = include.join(',');

	return await zohoDeskClient.request<ZohoDeskPage<ZohoDeskTicket>>({
		auth,
		method: HttpMethod.GET,
		path: '/tickets',
		orgId,
		query,
	});
}

async function createTicket({
	auth,
	orgId,
	...fields
}: CreateTicketParams & { auth: ZohoDeskAuthValue }): Promise<ZohoDeskTicket> {
	const body: Record<string, unknown> = {
		departmentId: fields.departmentId,
		subject: fields.subject,
		description: fields.description,
	};

	if (fields.contactId) body['contactId'] = fields.contactId;
	if (fields.email) body['email'] = fields.email;
	if (fields.phone) body['phone'] = fields.phone;
	if (fields.status) body['status'] = fields.status;
	if (fields.priority) body['priority'] = fields.priority;
	if (fields.category) body['category'] = fields.category;
	if (fields.subCategory) body['subCategory'] = fields.subCategory;
	if (fields.dueDate) body['dueDate'] = fields.dueDate;
	if (fields.channel) body['channel'] = fields.channel;
	if (fields.assigneeId) body['assigneeId'] = fields.assigneeId;
	if (fields.productId) body['productId'] = fields.productId;
	if (fields.classification) body['classification'] = fields.classification;
	if (fields.language) body['language'] = fields.language;
	if (fields.entitySkills && fields.entitySkills.length > 0)
		body['entitySkills'] = fields.entitySkills;
	if (fields.customFields) body['cf'] = fields.customFields;

	return await zohoDeskClient.request<ZohoDeskTicket>({
		auth,
		method: HttpMethod.POST,
		path: '/tickets',
		orgId,
		body,
	});
}

async function searchContacts({
	auth,
	orgId,
	email,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	email: string;
}): Promise<ZohoDeskContact[]> {
	const response = await zohoDeskClient.request<ZohoDeskPage<ZohoDeskContact> | ''>({
		auth,
		method: HttpMethod.GET,
		path: '/contacts/search',
		orgId,
		query: { email },
	});
	if (isNil(response) || response === '') {
		return [];
	}
	return response.data;
}

export const zohoDeskApi = {
	listOrganizations,
	listDepartments,
	listTickets,
	createTicket,
	searchContacts,
};

type CreateTicketParams = {
	orgId: string;
	departmentId: string;
	subject: string;
	description: string;
	contactId?: string;
	email?: string;
	phone?: string;
	status?: string;
	priority?: string;
	category?: string;
	subCategory?: string;
	dueDate?: string;
	channel?: string;
	assigneeId?: string;
	productId?: string;
	classification?: string;
	language?: string;
	entitySkills?: unknown[];
	customFields?: Record<string, unknown>;
};
