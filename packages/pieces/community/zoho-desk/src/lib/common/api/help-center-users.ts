import { HttpMethod } from '@activepieces/pieces-common';

import { zohoDeskClient } from '../client';

import type { ZohoDeskAuthValue, ZohoDeskRecord } from '../types';

async function listUsers({
	auth,
	orgId,
	helpCenterId,
	status,
	searchBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	helpCenterId?: string;
	status?: string;
	searchBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/users`,
		query: { helpCenterId, status, searchBy, from, limit },
	});
}

async function getUser({
	auth,
	orgId,
	userId,
	helpCenterId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	userId: string;
	helpCenterId?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/users/${encodeURIComponent(userId)}`,
		query: { helpCenterId },
	});
}

async function updateUser({
	auth,
	orgId,
	userId,
	helpCenterId,
	status,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	userId: string;
	helpCenterId?: string;
	status: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PATCH,
		path: `/users/${encodeURIComponent(userId)}`,
		query: { helpCenterId },
		body: { status },
	});
}

async function listUserBadges({
	auth,
	orgId,
	userId,
	type,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	userId: string;
	type?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/users/${encodeURIComponent(userId)}/badges`,
		query: { type, from, limit },
	});
}

async function addUserBadges({
	auth,
	orgId,
	userId,
	badgeIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	userId: string;
	badgeIds: string[];
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/users/${encodeURIComponent(userId)}/badges/associate`,
		body: { badgeIds },
	});
}

async function removeUserBadges({
	auth,
	orgId,
	userId,
	badgeIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	userId: string;
	badgeIds: string[];
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/users/${encodeURIComponent(userId)}/badges/dissociate`,
		body: { badgeIds },
	});
}

async function listUserGroups({
	auth,
	orgId,
	userId,
	helpCenterId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	userId: string;
	helpCenterId?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/users/${encodeURIComponent(userId)}/groups`,
		query: { helpCenterId, from, limit },
	});
}

async function addUserGroups({
	auth,
	orgId,
	userId,
	helpCenterId,
	groupIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	userId: string;
	helpCenterId?: string;
	groupIds: string[];
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/users/${encodeURIComponent(userId)}/groups/associate`,
		query: { helpCenterId },
		body: { groups: groupIds.map((id) => ({ id })) },
	});
}

async function removeUserGroups({
	auth,
	orgId,
	userId,
	helpCenterId,
	groupIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	userId: string;
	helpCenterId?: string;
	groupIds: string[];
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/users/${encodeURIComponent(userId)}/groups/dissociate`,
		query: { helpCenterId },
		body: { groupIds },
	});
}

async function listUserLabels({
	auth,
	orgId,
	userId,
	helpCenterId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	userId: string;
	helpCenterId?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/users/${encodeURIComponent(userId)}/labels`,
		query: { helpCenterId, from, limit },
	});
}

async function assignUserLabels({
	auth,
	orgId,
	userId,
	helpCenterId,
	labelIds,
	primaryLabelId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	userId: string;
	helpCenterId?: string;
	labelIds: string[];
	primaryLabelId?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/users/${encodeURIComponent(userId)}/labels/assign`,
		query: { helpCenterId },
		body: { labels: labelIds.map((id) => ({ id, isPrimary: id === primaryLabelId })) },
	});
}

async function removeUserLabels({
	auth,
	orgId,
	userId,
	helpCenterId,
	labelIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	userId: string;
	helpCenterId?: string;
	labelIds: string[];
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/users/${encodeURIComponent(userId)}/labels/remove`,
		query: { helpCenterId },
		body: { labelIds },
	});
}

async function listHelpCenters({
	auth,
	orgId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/helpCenters`,
		query: { from, limit },
	});
}

async function listBadges({
	auth,
	orgId,
	type,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	type?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	const badges = await zohoDeskClient.request<ZohoDeskRecord[] | ''>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/badges`,
		query: { type, from, limit },
	});
	return badges || [];
}

async function listGroups({
	auth,
	orgId,
	helpCenterId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	helpCenterId?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/groups`,
		query: { helpCenterId, from, limit },
	});
}

async function listLabels({
	auth,
	orgId,
	helpCenterId,
	searchBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	helpCenterId?: string;
	searchBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/labels`,
		query: { helpCenterId, searchBy, from, limit },
	});
}

export const zohoDeskHelpCenterUsersApi = {
	listHelpCenters,
	listBadges,
	listGroups,
	listLabels,
	listUsers,
	getUser,
	updateUser,
	listUserBadges,
	addUserBadges,
	removeUserBadges,
	listUserGroups,
	addUserGroups,
	removeUserGroups,
	listUserLabels,
	assignUserLabels,
	removeUserLabels,
};
