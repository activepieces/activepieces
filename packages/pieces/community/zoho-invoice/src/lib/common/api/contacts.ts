import { HttpMethod } from '@activepieces/pieces-common';

import { zohoInvoiceClient } from '../client';
import { zohoInvoiceUtils } from '../utils';

import type { ZohoInvoiceAuthValue, ZohoInvoiceOrgScope, ZohoInvoiceResponse } from '../types';

async function createContact({
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
		path: '/contacts',
		body,
	});
}

async function listContacts({
	auth,
	organizationId,
	contactName,
	companyName,
	email,
	phone,
	filterBy,
	searchText,
	sortColumn,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactName?: string;
	companyName?: string;
	email?: string;
	phone?: string;
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
		path: '/contacts',
		query: zohoInvoiceUtils.toQuery({
			contact_name: contactName,
			company_name: companyName,
			email,
			phone,
			filter_by: filterBy,
			search_text: searchText,
			sort_column: sortColumn,
			page,
			per_page: perPage,
		}),
	});
}

async function getContact({
	auth,
	organizationId,
	contactId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
}): Promise<ZohoInvoiceContactResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceContactResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/contacts/${contactId}`,
	});
}

async function updateContact({
	auth,
	organizationId,
	contactId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/contacts/${contactId}`,
		body,
	});
}

async function deleteContact({
	auth,
	organizationId,
	contactId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/contacts/${contactId}`,
	});
}

async function markContactActive({
	auth,
	organizationId,
	contactId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/contacts/${contactId}/active`,
	});
}

async function markContactInactive({
	auth,
	organizationId,
	contactId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/contacts/${contactId}/inactive`,
	});
}

async function listContactAddresses({
	auth,
	organizationId,
	contactId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/contacts/${contactId}/address`,
	});
}

async function addContactAddress({
	auth,
	organizationId,
	contactId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/contacts/${contactId}/address`,
		body,
	});
}

async function updateContactAddress({
	auth,
	organizationId,
	contactId,
	addressId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
	addressId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/contacts/${contactId}/address/${addressId}`,
		body: { ...body, address_id: addressId },
	});
}

async function deleteContactAddress({
	auth,
	organizationId,
	contactId,
	addressId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
	addressId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/contacts/${contactId}/address/${addressId}`,
	});
}

async function listContactComments({
	auth,
	organizationId,
	contactId,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/contacts/${contactId}/comments`,
		query: zohoInvoiceUtils.toQuery({ page, per_page: perPage }),
	});
}

async function emailContact({
	auth,
	organizationId,
	contactId,
	sendCustomerStatement,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
	sendCustomerStatement?: boolean;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/contacts/${contactId}/email`,
		query: zohoInvoiceUtils.toQuery({ send_customer_statement: sendCustomerStatement }),
		body,
	});
}

async function disableContactPaymentReminders({
	auth,
	organizationId,
	contactId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/contacts/${contactId}/paymentreminder/disable`,
	});
}

async function enableContactPaymentReminders({
	auth,
	organizationId,
	contactId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/contacts/${contactId}/paymentreminder/enable`,
	});
}

async function enableContactPortalAccess({
	auth,
	organizationId,
	contactId,
	contactPersonIds,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
	contactPersonIds: string[];
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/contacts/${contactId}/portal/enable`,
		body: {
			contact_persons: contactPersonIds.map((contactPersonId) => ({
				contact_person_id: contactPersonId,
			})),
		},
	});
}

async function listContactRefunds({
	auth,
	organizationId,
	contactId,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/contacts/${contactId}/refunds`,
		query: zohoInvoiceUtils.toQuery({ page, per_page: perPage }),
	});
}

async function emailContactStatement({
	auth,
	organizationId,
	contactId,
	startDate,
	endDate,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
	startDate?: string;
	endDate?: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/contacts/${contactId}/statements/email`,
		query: zohoInvoiceUtils.toQuery({ start_date: startDate, end_date: endDate }),
		body,
	});
}

async function getContactStatementEmailContent({
	auth,
	organizationId,
	contactId,
	startDate,
	endDate,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
	startDate?: string;
	endDate?: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/contacts/${contactId}/statements/email`,
		query: zohoInvoiceUtils.toQuery({ start_date: startDate, end_date: endDate }),
	});
}

async function createContactPerson({
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
		path: '/contacts/contactpersons',
		body,
	});
}

async function listContactPersons({
	auth,
	organizationId,
	contactId,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/contacts/${contactId}/contactpersons`,
		query: zohoInvoiceUtils.toQuery({ page, per_page: perPage }),
	});
}

async function getContactPerson({
	auth,
	organizationId,
	contactId,
	contactPersonId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactId: string;
	contactPersonId: string;
}): Promise<ZohoInvoiceContactPersonResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceContactPersonResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/contacts/${contactId}/contactpersons/${contactPersonId}`,
	});
}

async function updateContactPerson({
	auth,
	organizationId,
	contactPersonId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactPersonId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/contacts/contactpersons/${contactPersonId}`,
		body,
	});
}

async function deleteContactPerson({
	auth,
	organizationId,
	contactPersonId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactPersonId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/contacts/contactpersons/${contactPersonId}`,
	});
}

async function markContactPersonPrimary({
	auth,
	organizationId,
	contactPersonId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	contactPersonId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/contacts/contactpersons/${contactPersonId}/primary`,
	});
}

export const contactsApi = {
	createContact,
	listContacts,
	getContact,
	updateContact,
	deleteContact,
	markContactActive,
	markContactInactive,
	listContactAddresses,
	addContactAddress,
	updateContactAddress,
	deleteContactAddress,
	listContactComments,
	emailContact,
	disableContactPaymentReminders,
	enableContactPaymentReminders,
	enableContactPortalAccess,
	listContactRefunds,
	emailContactStatement,
	getContactStatementEmailContent,
	createContactPerson,
	listContactPersons,
	getContactPerson,
	updateContactPerson,
	deleteContactPerson,
	markContactPersonPrimary,
};

export type ZohoInvoiceContactResponse = ZohoInvoiceResponse & {
	contact?: { contact_name?: string };
};

export type ZohoInvoiceContactPersonResponse = ZohoInvoiceResponse & {
	contact_person?: {
		salutation?: string;
		first_name?: string;
		last_name?: string;
		email?: string;
		phone?: string;
		mobile?: string;
		skype?: string;
		designation?: string;
		department?: string;
	};
};
