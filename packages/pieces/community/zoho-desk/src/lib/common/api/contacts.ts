import { HttpMethod } from '@activepieces/pieces-common';

import { zohoDeskClient } from '../client';

import type { ZohoDeskAuthValue, ZohoDeskContact, ZohoDeskFile, ZohoDeskRecord } from '../types';

async function searchContacts({
	auth,
	orgId,
	email,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	email: string;
}): Promise<ZohoDeskContact[]> {
	return await zohoDeskClient.list<ZohoDeskContact>({
		auth,
		method: HttpMethod.GET,
		path: '/contacts/search',
		orgId,
		query: { email },
	});
}

async function listContacts({
	auth,
	orgId,
	viewId,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	viewId?: string;
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts`,
		query: { viewId, sortBy, from, limit },
	});
}

async function getContact({
	auth,
	orgId,
	contactId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts/${encodeURIComponent(contactId)}`,
	});
}

async function createContact({
	auth,
	orgId,
	lastName,
	firstName,
	email,
	secondaryEmail,
	phone,
	mobile,
	accountId,
	ownerId,
	title,
	type,
	description,
	street,
	city,
	state,
	zip,
	country,
	language,
	customFields,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	lastName: string;
	firstName?: string;
	email?: string;
	secondaryEmail?: string;
	phone?: string;
	mobile?: string;
	accountId?: string;
	ownerId?: string;
	title?: string;
	type?: string;
	description?: string;
	street?: string;
	city?: string;
	state?: string;
	zip?: string;
	country?: string;
	language?: string;
	customFields?: Record<string, unknown>;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contacts`,
		body: {
			lastName,
			firstName,
			email,
			secondaryEmail,
			phone,
			mobile,
			accountId,
			ownerId,
			title,
			type,
			description,
			street,
			city,
			state,
			zip,
			country,
			language,
			cf: customFields,
		},
	});
}

async function updateContact({
	auth,
	orgId,
	contactId,
	lastName,
	firstName,
	email,
	secondaryEmail,
	phone,
	mobile,
	accountId,
	ownerId,
	title,
	type,
	description,
	street,
	city,
	state,
	zip,
	country,
	language,
	customFields,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	lastName?: string;
	firstName?: string;
	email?: string;
	secondaryEmail?: string;
	phone?: string;
	mobile?: string;
	accountId?: string;
	ownerId?: string;
	title?: string;
	type?: string;
	description?: string;
	street?: string;
	city?: string;
	state?: string;
	zip?: string;
	country?: string;
	language?: string;
	customFields?: Record<string, unknown>;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PATCH,
		path: `/contacts/${encodeURIComponent(contactId)}`,
		body: {
			lastName,
			firstName,
			email,
			secondaryEmail,
			phone,
			mobile,
			accountId,
			ownerId,
			title,
			type,
			description,
			street,
			city,
			state,
			zip,
			country,
			language,
			cf: customFields,
		},
	});
}

async function deleteContacts({
	auth,
	orgId,
	contactIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactIds: string[];
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contacts/moveToTrash`,
		body: { contactIds },
	});
}

async function searchContactsByFilter({
	auth,
	orgId,
	searchText,
	email,
	phone,
	mobile,
	firstName,
	lastName,
	fullName,
	accountName,
	createdTimeRange,
	modifiedTimeRange,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	searchText?: string;
	email?: string;
	phone?: string;
	mobile?: string;
	firstName?: string;
	lastName?: string;
	fullName?: string;
	accountName?: string;
	createdTimeRange?: string;
	modifiedTimeRange?: string;
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts/search`,
		query: {
			_all: searchText,
			email,
			phone,
			mobile,
			firstName,
			lastName,
			fullName,
			accountName,
			createdTimeRange,
			modifiedTimeRange,
			sortBy,
			from,
			limit,
		},
	});
}

async function getContactsByIds({
	auth,
	orgId,
	contactIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactIds: string[];
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts/contactsByIds`,
		query: { ids: contactIds },
	});
}

async function countContacts({
	auth,
	orgId,
	viewId,
	startsWith,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	viewId: string;
	startsWith?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts/count`,
		query: { viewId, startsWith },
	});
}

async function updateManyContacts({
	auth,
	orgId,
	contactIds,
	fieldName,
	fieldValue,
	isCustomField,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactIds: string[];
	fieldName: string;
	fieldValue?: string;
	isCustomField?: boolean;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contacts/updateMany`,
		body: { ids: contactIds, fieldName, fieldValue, isCustomField },
	});
}

async function listContactAccounts({
	auth,
	orgId,
	contactId,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts/${encodeURIComponent(contactId)}/accounts`,
		query: { sortBy, from, limit },
	});
}

async function listContactTickets({
	auth,
	orgId,
	contactId,
	departmentId,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	departmentId?: string;
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts/${encodeURIComponent(contactId)}/tickets`,
		query: { departmentId, sortBy, from, limit },
	});
}

async function listContactProducts({
	auth,
	orgId,
	contactId,
	departmentId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	departmentId?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts/${encodeURIComponent(contactId)}/products`,
		query: { departmentId, from, limit },
	});
}

async function associateContactAccounts({
	auth,
	orgId,
	contactId,
	accountIds,
	canViewAccountTickets,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	accountIds: string[];
	canViewAccountTickets?: boolean;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contacts/${encodeURIComponent(contactId)}/associateAccounts`,
		body: {
			data: accountIds.map((id) => ({
				id,
				isAccountTicketsViewable: canViewAccountTickets ?? false,
			})),
		},
	});
}

async function dissociateContactAccounts({
	auth,
	orgId,
	contactId,
	accountIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	accountIds: string[];
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contacts/${encodeURIComponent(contactId)}/dissociateAccounts`,
		body: { ids: accountIds },
	});
}

async function associateContactProducts({
	auth,
	orgId,
	contactId,
	productIds,
	associate,
	departmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	productIds: string[];
	associate: boolean;
	departmentId?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contacts/${encodeURIComponent(contactId)}/associateProducts`,
		body: { ids: productIds, associate, departmentId },
	});
}

async function listContactAttachments({
	auth,
	orgId,
	contactId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts/${encodeURIComponent(contactId)}/attachments`,
		query: { from, limit },
	});
}

async function uploadContactAttachment({
	auth,
	orgId,
	contactId,
	file,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	file: ZohoDeskFile;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.upload<ZohoDeskRecord>({
		auth,
		orgId,
		path: `/contacts/${encodeURIComponent(contactId)}/attachments`,
		file,
	});
}

async function deleteContactAttachment({
	auth,
	orgId,
	contactId,
	attachmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	attachmentId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.DELETE,
		path: `/contacts/${encodeURIComponent(contactId)}/attachments/${encodeURIComponent(
			attachmentId,
		)}`,
	});
}

async function listContactComments({
	auth,
	orgId,
	contactId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts/${encodeURIComponent(contactId)}/comments`,
		query: { from, limit },
	});
}

async function getContactComment({
	auth,
	orgId,
	contactId,
	commentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	commentId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts/${encodeURIComponent(contactId)}/comments/${encodeURIComponent(commentId)}`,
	});
}

async function createContactComment({
	auth,
	orgId,
	contactId,
	content,
	contentType,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	content: string;
	contentType?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contacts/${encodeURIComponent(contactId)}/comments`,
		body: { content, contentType },
	});
}

async function updateContactComment({
	auth,
	orgId,
	contactId,
	commentId,
	content,
	contentType,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	commentId: string;
	content: string;
	contentType?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PUT,
		path: `/contacts/${encodeURIComponent(contactId)}/comments/${encodeURIComponent(commentId)}`,
		body: { content, contentType },
	});
}

async function deleteContactComment({
	auth,
	orgId,
	contactId,
	commentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	commentId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.DELETE,
		path: `/contacts/${encodeURIComponent(contactId)}/comments/${encodeURIComponent(commentId)}`,
	});
}

async function listContactFollowers({
	auth,
	orgId,
	contactId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts/${encodeURIComponent(contactId)}/followers`,
		query: { from, limit },
	});
}

async function addContactFollowers({
	auth,
	orgId,
	contactId,
	followerIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	followerIds: string[];
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contacts/${encodeURIComponent(contactId)}/addFollowers`,
		body: { followerIds },
	});
}

async function removeContactFollowers({
	auth,
	orgId,
	contactId,
	followerIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	followerIds: string[];
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contacts/${encodeURIComponent(contactId)}/removeFollowers`,
		body: { followerIds },
	});
}

async function listContactHistory({
	auth,
	orgId,
	contactId,
	agentId,
	departmentId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	agentId?: string;
	departmentId?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts/${encodeURIComponent(contactId)}/history`,
		query: { agentId, departmentId, from, limit },
	});
}

async function getContactStatistics({
	auth,
	orgId,
	contactId,
	departmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	departmentId?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts/${encodeURIComponent(contactId)}/statistics`,
		query: { departmentId },
	});
}

async function mergeContacts({
	auth,
	orgId,
	contactId,
	contactIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	contactIds: string[];
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contacts/${encodeURIComponent(contactId)}/merge`,
		body: { ids: contactIds },
	});
}

async function markContactsSpam({
	auth,
	orgId,
	contactIds,
	isSpam,
	handleExistingTickets,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactIds: string[];
	isSpam: boolean;
	handleExistingTickets?: boolean;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contacts/markSpam`,
		body: { ids: contactIds, isSpam, handleExistingTickets },
	});
}

async function deleteSpamContacts({
	auth,
	orgId,
	contactIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactIds: string[];
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contacts/deleteSpam`,
		body: { contactIds },
	});
}

async function inviteContactToHelpCenter({
	auth,
	orgId,
	contactId,
	helpCenterId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	helpCenterId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contacts/${encodeURIComponent(contactId)}/inviteAsEndUser`,
		body: { helpCenterId },
	});
}

async function approveContactHelpCenterAccess({
	auth,
	orgId,
	contactId,
	helpCenterIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	helpCenterIds: string[];
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contacts/${encodeURIComponent(contactId)}/approveEndUserInvite`,
		body: { helpCenterIds },
	});
}

async function rejectContactHelpCenterAccess({
	auth,
	orgId,
	contactId,
	helpCenterIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	helpCenterIds: string[];
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/contacts/${encodeURIComponent(contactId)}/rejectEndUserInvite`,
		body: { helpCenterIds },
	});
}

async function listContactHelpCenters({
	auth,
	orgId,
	contactId,
	helpCenterId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	helpCenterId?: string;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts/${encodeURIComponent(contactId)}/helpCenters`,
		query: { helpCenterId },
	});
}

async function listContactProfiles({
	auth,
	orgId,
	contactId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts/${encodeURIComponent(contactId)}/profiles`,
	});
}

export const zohoDeskContactsApi = {
	searchContacts,
	listContacts,
	getContact,
	createContact,
	updateContact,
	deleteContacts,
	searchContactsByFilter,
	getContactsByIds,
	countContacts,
	updateManyContacts,
	listContactAccounts,
	listContactTickets,
	listContactProducts,
	associateContactAccounts,
	dissociateContactAccounts,
	associateContactProducts,
	listContactAttachments,
	uploadContactAttachment,
	deleteContactAttachment,
	listContactComments,
	getContactComment,
	createContactComment,
	updateContactComment,
	deleteContactComment,
	listContactFollowers,
	addContactFollowers,
	removeContactFollowers,
	listContactHistory,
	getContactStatistics,
	mergeContacts,
	markContactsSpam,
	deleteSpamContacts,
	inviteContactToHelpCenter,
	approveContactHelpCenterAccess,
	rejectContactHelpCenterAccess,
	listContactHelpCenters,
	listContactProfiles,
};
