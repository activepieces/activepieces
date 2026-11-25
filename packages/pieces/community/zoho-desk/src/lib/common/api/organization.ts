import { HttpMethod } from '@activepieces/pieces-common';

import { zohoDeskClient } from '../client';

import type {
	ZohoDeskAuthValue,
	ZohoDeskDepartment,
	ZohoDeskOrganization,
	ZohoDeskPage,
	ZohoDeskRecord,
} from '../types';

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

async function listOrganizationRecords({
	auth,
}: {
	auth: ZohoDeskAuthValue;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		method: HttpMethod.GET,
		path: `/organizations`,
	});
}

async function getOrganization({
	auth,
	organizationId,
	includeCustomDomain,
}: {
	auth: ZohoDeskAuthValue;
	organizationId: string;
	includeCustomDomain?: boolean;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		method: HttpMethod.GET,
		path: `/organizations/${encodeURIComponent(organizationId)}`,
		query: { includeCustomDomain },
	});
}

async function listAgents({
	auth,
	orgId,
	searchStr,
	fieldName,
	departmentIds,
	roleIds,
	status,
	isConfirmed,
	isLightAgent,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	searchStr?: string;
	fieldName?: string;
	departmentIds?: string[];
	roleIds?: string[];
	status?: string;
	isConfirmed?: boolean;
	isLightAgent?: boolean;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/agents`,
		query: {
			searchStr,
			fieldName,
			departmentIds,
			roleIds,
			status,
			isConfirmed,
			isLightAgent,
			from,
			limit,
		},
	});
}

async function getAgent({
	auth,
	orgId,
	agentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	agentId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/agents/${encodeURIComponent(agentId)}`,
	});
}

async function findAgentByEmail({
	auth,
	orgId,
	email,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	email: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/agents/email/${encodeURIComponent(email).replace(/%40/g, '@')}`,
	});
}

async function countAgents({
	auth,
	orgId,
	status,
	isConfirmed,
	includeLightAgent,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	status?: string;
	isConfirmed?: boolean;
	includeLightAgent?: boolean;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/agents/count`,
		query: { status, isConfirmed, includeLightAgent },
	});
}

async function countAgentsByType({
	auth,
	orgId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/agents/allCounts`,
	});
}

async function getCurrentAgent({
	auth,
	orgId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/myinfo`,
	});
}

async function listDepartmentRecords({
	auth,
	orgId,
	searchStr,
	isEnabled,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	searchStr?: string;
	isEnabled?: boolean;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/departments`,
		query: { searchStr, isEnabled, from, limit },
	});
}

async function getDepartment({
	auth,
	orgId,
	departmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	departmentId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/departments/${encodeURIComponent(departmentId)}`,
	});
}

async function countDepartments({
	auth,
	orgId,
	isEnabled,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	isEnabled?: boolean;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/departments/count`,
		query: { isEnabled },
	});
}

async function listDepartmentAgents({
	auth,
	orgId,
	departmentId,
	searchStr,
	fieldName,
	status,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	departmentId: string;
	searchStr?: string;
	fieldName?: string;
	status?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/departments/${encodeURIComponent(departmentId)}/agents`,
		query: { searchStr, fieldName, status, from, limit },
	});
}

async function listDepartmentTeams({
	auth,
	orgId,
	departmentId,
	searchStr,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	departmentId: string;
	searchStr?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/departments/${encodeURIComponent(departmentId)}/teams`,
		query: { searchStr, from, limit },
	});
}

async function getTeam({
	auth,
	orgId,
	teamId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	teamId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/teams/${encodeURIComponent(teamId)}`,
	});
}

async function listTeamMembers({
	auth,
	orgId,
	teamId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	teamId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/teams/${encodeURIComponent(teamId)}/members`,
	});
}

async function listRoles({
	auth,
	orgId,
	searchStr,
	isDefault,
	isVisible,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	searchStr?: string;
	isDefault?: boolean;
	isVisible?: boolean;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/roles`,
		query: { searchStr, isDefault, isVisible, from, limit },
	});
}

async function getRole({
	auth,
	orgId,
	roleId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	roleId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/roles/${encodeURIComponent(roleId)}`,
	});
}

async function getRolesByIds({
	auth,
	orgId,
	roleIds,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	roleIds: string[];
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/rolesByIds`,
		query: { roleIds },
	});
}

async function countRoles({
	auth,
	orgId,
	isDefault,
	isVisible,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	isDefault?: boolean;
	isVisible?: boolean;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/roles/count`,
		query: { isDefault, isVisible },
	});
}

async function listViews({
	auth,
	orgId,
	module,
	departmentId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	module: string;
	departmentId?: string;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/views`,
		query: { module, departmentId },
	});
}

async function listFields({
	auth,
	orgId,
	module,
	departmentId,
	apiNames,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	module: string;
	departmentId?: string;
	apiNames?: string[];
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/organizationFields`,
		query: { module, departmentId, apiNames },
	});
}

async function search({
	auth,
	orgId,
	searchStr,
	departmentId,
	sortBy,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	searchStr: string;
	departmentId?: string;
	sortBy?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/search`,
		query: { searchStr, departmentId, sortBy, from, limit },
	});
}

export const zohoDeskOrganizationApi = {
	listOrganizations,
	listDepartments,
	listOrganizationRecords,
	getOrganization,
	listAgents,
	getAgent,
	findAgentByEmail,
	countAgents,
	countAgentsByType,
	getCurrentAgent,
	listDepartmentRecords,
	getDepartment,
	countDepartments,
	listDepartmentAgents,
	listDepartmentTeams,
	getTeam,
	listTeamMembers,
	listRoles,
	getRole,
	getRolesByIds,
	countRoles,
	listViews,
	listFields,
	search,
};
