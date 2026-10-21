import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { clockifyClient } from './client';

import type {
	ClockifyAuthValue,
	ClockifyProject,
	ClockifyTag,
	ClockifyTask,
	ClockifyTimeEntry,
	ClockifyUser,
	ClockifyWebhook,
	ClockifyWorkspace,
	ClockifyMemberProfile,
	ClockifyRole,
	ClockifyUserCustomFieldValue,
	ClockifyUserGroup,
	ClockifyClient,
	ClockifyClientInput,
	ClockifyProjectInput,
	ClockifyCustomField,
	ClockifyTaskInput,
	ClockifyTimeEntryInput,
	ClockifyEntityFilter,
	ClockifyReport,
	ClockifyReportRequest,
	ClockifySharedReport,
	ClockifySharedReportInput,
	ClockifySharedReportPage,
	ClockifySharedReportUpdate,
	ClockifyTemplate,
	ClockifyHoliday,
	ClockifyAssignment,
} from './types';

async function getCurrentUser({
	auth,
	query,
}: {
	auth: ClockifyAuthValue;
	query?: QueryParams;
}): Promise<ClockifyUser> {
	return await clockifyClient.request<ClockifyUser>({
		auth,
		method: HttpMethod.GET,
		path: '/user',
		query,
	});
}

async function listWorkspaces({
	auth,
	query,
}: {
	auth: ClockifyAuthValue;
	query?: QueryParams;
}): Promise<ClockifyWorkspace[]> {
	return await clockifyClient.request<ClockifyWorkspace[]>({
		auth,
		method: HttpMethod.GET,
		path: '/workspaces',
		query,
	});
}

async function listProjects({
	auth,
	workspaceId,
	query,
}: WorkspaceScope & { auth: ClockifyAuthValue; query?: QueryParams }): Promise<ClockifyProject[]> {
	return await clockifyClient.request<ClockifyProject[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/projects`,
		query,
	});
}

async function listUsers({
	auth,
	workspaceId,
}: {
	auth: ClockifyAuthValue;
	workspaceId: string;
}): Promise<ClockifyUser[]> {
	return await clockifyClient.request<ClockifyUser[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/users`,
	});
}

async function listTags({
	auth,
	workspaceId,
	query,
}: WorkspaceScope & { auth: ClockifyAuthValue; query?: QueryParams }): Promise<ClockifyTag[]> {
	return await clockifyClient.request<ClockifyTag[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/tags`,
		query,
	});
}

async function listTasks({
	auth,
	workspaceId,
	projectId,
	query,
}: {
	auth: ClockifyAuthValue;
	workspaceId: string;
	projectId: string;
	query?: QueryParams;
}): Promise<ClockifyTask[]> {
	return await clockifyClient.request<ClockifyTask[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
		query,
	});
}

async function createTask({
	auth,
	workspaceId,
	projectId,
	name,
	status,
	assigneeIds,
	estimate,
	userGroupIds,
}: CreateTaskParams & { auth: ClockifyAuthValue }): Promise<ClockifyTask> {
	return await clockifyClient.request<ClockifyTask>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
		body: {
			name,
			status,
			assigneeIds,
			estimate,
			userGroupIds,
		},
	});
}

async function createTimeEntry({
	auth,
	workspaceId,
	billable,
	description,
	start,
	end,
	projectId,
	taskId,
	tagIds,
}: CreateTimeEntryParams & { auth: ClockifyAuthValue }): Promise<ClockifyTimeEntry> {
	return await clockifyClient.request<ClockifyTimeEntry>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/time-entries`,
		body: {
			billable,
			description,
			start,
			end,
			projectId,
			taskId,
			tagIds,
			type: 'REGULAR',
		},
	});
}

async function listInProgressTimeEntries({
	auth,
	workspaceId,
	query,
}: WorkspaceScope & { auth: ClockifyAuthValue; query?: QueryParams }): Promise<
	ClockifyTimeEntry[]
> {
	return await clockifyClient.request<ClockifyTimeEntry[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/time-entries/status/in-progress`,
		query,
	});
}

async function listUserTimeEntries({
	auth,
	workspaceId,
	userId,
	query,
}: {
	auth: ClockifyAuthValue;
	workspaceId: string;
	userId: string;
	query: QueryParams;
}): Promise<ClockifyTimeEntry[]> {
	return await clockifyClient.request<ClockifyTimeEntry[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/user/${userId}/time-entries`,
		query,
	});
}

async function stopUserTimer({
	auth,
	workspaceId,
	userId,
	end,
}: {
	auth: ClockifyAuthValue;
	workspaceId: string;
	userId: string;
	end: string;
}): Promise<ClockifyTimeEntry> {
	return await clockifyClient.request<ClockifyTimeEntry>({
		auth,
		method: HttpMethod.PATCH,
		path: `/workspaces/${workspaceId}/user/${userId}/time-entries`,
		body: {
			end,
		},
	});
}

async function createWebhook({
	auth,
	workspaceId,
	url,
	webhookEvent,
	triggerSourceType,
	triggerSource,
}: CreateWebhookParams & { auth: ClockifyAuthValue }): Promise<ClockifyWebhook> {
	return await clockifyClient.request<ClockifyWebhook>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/webhooks`,
		body: {
			url,
			webhookEvent,
			triggerSourceType,
			triggerSource,
		},
	});
}

async function deleteWebhook({
	auth,
	workspaceId,
	webhookId,
}: {
	auth: ClockifyAuthValue;
	workspaceId: string;
	webhookId: string;
}): Promise<void> {
	await clockifyClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/workspaces/${workspaceId}/webhooks/${webhookId}`,
	});
}

async function getWorkspace({
	auth,
	workspaceId,
}: WorkspaceScope & { auth: ClockifyAuthValue }): Promise<ClockifyWorkspace> {
	return await clockifyClient.request<ClockifyWorkspace>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}`,
	});
}

async function createWorkspace({
	auth,
	name,
	organizationId,
}: {
	auth: ClockifyAuthValue;
	name: string;
	organizationId: string | undefined;
}): Promise<ClockifyWorkspace> {
	return await clockifyClient.request<ClockifyWorkspace>({
		auth,
		method: HttpMethod.POST,
		path: '/workspaces',
		body: { name, organizationId },
	});
}

async function updateWorkspaceBillableRate({
	auth,
	workspaceId,
	amount,
	currency,
	since,
	includeApproved,
}: WorkspaceScope &
	RateParams & { auth: ClockifyAuthValue; currency: string }): Promise<ClockifyWorkspace> {
	return await clockifyClient.request<ClockifyWorkspace>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/hourly-rate`,
		body: { amount, currency, since, includeApproved },
	});
}

async function updateWorkspaceCostRate({
	auth,
	workspaceId,
	amount,
	since,
	includeApproved,
}: WorkspaceScope & RateParams & { auth: ClockifyAuthValue }): Promise<ClockifyWorkspace> {
	return await clockifyClient.request<ClockifyWorkspace>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/cost-rate`,
		body: { amount, since, includeApproved },
	});
}

async function filterUsers({
	auth,
	workspaceId,
	filter,
}: WorkspaceScope & { auth: ClockifyAuthValue; filter: UserFilter }): Promise<ClockifyUser[]> {
	return await clockifyClient.request<ClockifyUser[]>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/users/info`,
		body: filter,
	});
}

async function updateUserStatus({
	auth,
	workspaceId,
	userId,
	status,
}: UserScope & { auth: ClockifyAuthValue; status: string }): Promise<ClockifyWorkspace> {
	return await clockifyClient.request<ClockifyWorkspace>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/users/${userId}`,
		body: { status },
	});
}

async function updateUserBillableRate({
	auth,
	workspaceId,
	userId,
	amount,
	since,
	includeApproved,
}: UserScope & RateParams & { auth: ClockifyAuthValue }): Promise<ClockifyWorkspace> {
	return await clockifyClient.request<ClockifyWorkspace>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/users/${userId}/hourly-rate`,
		body: { amount, since, includeApproved },
	});
}

async function updateUserCostRate({
	auth,
	workspaceId,
	userId,
	amount,
	since,
	includeApproved,
}: UserScope & RateParams & { auth: ClockifyAuthValue }): Promise<ClockifyWorkspace> {
	return await clockifyClient.request<ClockifyWorkspace>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/users/${userId}/cost-rate`,
		body: { amount, since, includeApproved },
	});
}

async function updateUserCustomField({
	auth,
	workspaceId,
	userId,
	customFieldId,
	value,
}: UserScope & {
	auth: ClockifyAuthValue;
	customFieldId: string;
	value: string;
}): Promise<ClockifyUserCustomFieldValue> {
	return await clockifyClient.request<ClockifyUserCustomFieldValue>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/users/${userId}/custom-field/${customFieldId}/value`,
		body: { value },
	});
}

async function listUserManagers({
	auth,
	workspaceId,
	userId,
	query,
}: UserScope & { auth: ClockifyAuthValue; query: QueryParams }): Promise<ClockifyUser[]> {
	return await clockifyClient.request<ClockifyUser[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/users/${userId}/managers`,
		query,
	});
}

async function addUserRole({
	auth,
	workspaceId,
	userId,
	role,
	entityId,
	sourceType,
}: UserScope & RoleParams & { auth: ClockifyAuthValue }): Promise<ClockifyRole[]> {
	return await clockifyClient.request<ClockifyRole[]>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/users/${userId}/roles`,
		body: { role, entityId, sourceType },
	});
}

async function removeUserRole({
	auth,
	workspaceId,
	userId,
	role,
	entityId,
	sourceType,
}: UserScope & RoleParams & { auth: ClockifyAuthValue }): Promise<void> {
	await clockifyClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/workspaces/${workspaceId}/users/${userId}/roles`,
		body: { role, entityId, sourceType },
	});
}

async function getMemberProfile({
	auth,
	workspaceId,
	userId,
}: UserScope & { auth: ClockifyAuthValue }): Promise<ClockifyMemberProfile> {
	return await clockifyClient.request<ClockifyMemberProfile>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/member-profile/${userId}`,
	});
}

async function updateMemberProfile({
	auth,
	workspaceId,
	userId,
	changes,
}: UserScope & {
	auth: ClockifyAuthValue;
	changes: MemberProfileChanges;
}): Promise<ClockifyMemberProfile> {
	return await clockifyClient.request<ClockifyMemberProfile>({
		auth,
		method: HttpMethod.PATCH,
		path: `/workspaces/${workspaceId}/member-profile/${userId}`,
		body: changes,
	});
}

async function listUserGroups({
	auth,
	workspaceId,
	query,
}: WorkspaceScope & { auth: ClockifyAuthValue; query: QueryParams }): Promise<ClockifyUserGroup[]> {
	return await clockifyClient.request<ClockifyUserGroup[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/user-groups`,
		query,
	});
}

async function createUserGroup({
	auth,
	workspaceId,
	name,
}: WorkspaceScope & { auth: ClockifyAuthValue; name: string }): Promise<ClockifyUserGroup> {
	return await clockifyClient.request<ClockifyUserGroup>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/user-groups`,
		body: { name },
	});
}

async function updateUserGroup({
	auth,
	workspaceId,
	userGroupId,
	name,
}: UserGroupScope & { auth: ClockifyAuthValue; name: string }): Promise<ClockifyUserGroup> {
	return await clockifyClient.request<ClockifyUserGroup>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/user-groups/${userGroupId}`,
		body: { name },
	});
}

async function deleteUserGroup({
	auth,
	workspaceId,
	userGroupId,
}: UserGroupScope & { auth: ClockifyAuthValue }): Promise<ClockifyUserGroup> {
	return await clockifyClient.request<ClockifyUserGroup>({
		auth,
		method: HttpMethod.DELETE,
		path: `/workspaces/${workspaceId}/user-groups/${userGroupId}`,
	});
}

async function addUserToGroup({
	auth,
	workspaceId,
	userGroupId,
	userId,
}: UserGroupScope & { auth: ClockifyAuthValue; userId: string }): Promise<ClockifyUserGroup> {
	return await clockifyClient.request<ClockifyUserGroup>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/user-groups/${userGroupId}/users`,
		body: { userId },
	});
}

async function removeUserFromGroup({
	auth,
	workspaceId,
	userGroupId,
	userId,
}: UserGroupScope & { auth: ClockifyAuthValue; userId: string }): Promise<ClockifyUserGroup> {
	return await clockifyClient.request<ClockifyUserGroup>({
		auth,
		method: HttpMethod.DELETE,
		path: `/workspaces/${workspaceId}/user-groups/${userGroupId}/users/${userId}`,
	});
}

async function listClients({
	auth,
	workspaceId,
	query,
}: WorkspaceScope & { auth: ClockifyAuthValue; query: QueryParams }): Promise<ClockifyClient[]> {
	return await clockifyClient.request<ClockifyClient[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/clients`,
		query,
	});
}

async function getClient({
	auth,
	workspaceId,
	clientId,
}: WorkspaceScope & { auth: ClockifyAuthValue; clientId: string }): Promise<ClockifyClient> {
	return await clockifyClient.request<ClockifyClient>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/clients/${clientId}`,
	});
}

async function createClient({
	auth,
	workspaceId,
	client,
}: WorkspaceScope & {
	auth: ClockifyAuthValue;
	client: ClockifyClientInput;
}): Promise<ClockifyClient> {
	return await clockifyClient.request<ClockifyClient>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/clients`,
		body: client,
	});
}

async function updateClient({
	auth,
	workspaceId,
	clientId,
	client,
	query,
}: WorkspaceScope & {
	auth: ClockifyAuthValue;
	clientId: string;
	client: ClockifyClientInput;
	query: QueryParams;
}): Promise<ClockifyClient> {
	return await clockifyClient.request<ClockifyClient>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/clients/${clientId}`,
		body: client,
		query,
	});
}

async function deleteClient({
	auth,
	workspaceId,
	clientId,
}: WorkspaceScope & { auth: ClockifyAuthValue; clientId: string }): Promise<ClockifyClient> {
	return await clockifyClient.request<ClockifyClient>({
		auth,
		method: HttpMethod.DELETE,
		path: `/workspaces/${workspaceId}/clients/${clientId}`,
	});
}

async function getTag({
	auth,
	workspaceId,
	tagId,
}: WorkspaceScope & { auth: ClockifyAuthValue; tagId: string }): Promise<ClockifyTag> {
	return await clockifyClient.request<ClockifyTag>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/tags/${tagId}`,
	});
}

async function createTag({
	auth,
	workspaceId,
	name,
}: WorkspaceScope & { auth: ClockifyAuthValue; name: string }): Promise<ClockifyTag> {
	return await clockifyClient.request<ClockifyTag>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/tags`,
		body: { name },
	});
}

async function updateTag({
	auth,
	workspaceId,
	tagId,
	name,
	archived,
}: WorkspaceScope & {
	auth: ClockifyAuthValue;
	tagId: string;
	name: string;
	archived: boolean;
}): Promise<ClockifyTag> {
	return await clockifyClient.request<ClockifyTag>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/tags/${tagId}`,
		body: { name, archived },
	});
}

async function deleteTag({
	auth,
	workspaceId,
	tagId,
}: WorkspaceScope & { auth: ClockifyAuthValue; tagId: string }): Promise<ClockifyTag> {
	return await clockifyClient.request<ClockifyTag>({
		auth,
		method: HttpMethod.DELETE,
		path: `/workspaces/${workspaceId}/tags/${tagId}`,
	});
}

async function getProject({
	auth,
	workspaceId,
	projectId,
}: ProjectScope & { auth: ClockifyAuthValue }): Promise<ClockifyProject> {
	return await clockifyClient.request<ClockifyProject>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/projects/${projectId}`,
	});
}

async function createProject({
	auth,
	workspaceId,
	project,
}: WorkspaceScope & {
	auth: ClockifyAuthValue;
	project: ClockifyProjectInput;
}): Promise<ClockifyProject> {
	return await clockifyClient.request<ClockifyProject>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/projects`,
		body: project,
	});
}

async function createProjectFromTemplate({
	auth,
	workspaceId,
	project,
}: WorkspaceScope & {
	auth: ClockifyAuthValue;
	project: ProjectFromTemplateInput;
}): Promise<ClockifyProject> {
	return await clockifyClient.request<ClockifyProject>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/projects/from-template`,
		body: project,
	});
}

async function updateProject({
	auth,
	workspaceId,
	projectId,
	project,
}: ProjectScope & {
	auth: ClockifyAuthValue;
	project: ClockifyProjectInput;
}): Promise<ClockifyProject> {
	return await clockifyClient.request<ClockifyProject>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/projects/${projectId}`,
		body: project,
	});
}

async function deleteProject({
	auth,
	workspaceId,
	projectId,
}: ProjectScope & { auth: ClockifyAuthValue }): Promise<ClockifyProject> {
	return await clockifyClient.request<ClockifyProject>({
		auth,
		method: HttpMethod.DELETE,
		path: `/workspaces/${workspaceId}/projects/${projectId}`,
	});
}

async function replaceProjectMemberships({
	auth,
	workspaceId,
	projectId,
	userIds,
}: ProjectScope & { auth: ClockifyAuthValue; userIds: string[] }): Promise<ClockifyProject> {
	return await clockifyClient.request<ClockifyProject>({
		auth,
		method: HttpMethod.PATCH,
		path: `/workspaces/${workspaceId}/projects/${projectId}/memberships`,
		body: { memberships: userIds.map((userId) => ({ userId })) },
	});
}

async function assignProjectUsers({
	auth,
	workspaceId,
	projectId,
	userIds,
	remove,
}: ProjectScope & {
	auth: ClockifyAuthValue;
	userIds: string[];
	remove: boolean;
}): Promise<ClockifyProject> {
	return await clockifyClient.request<ClockifyProject>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/projects/${projectId}/memberships`,
		body: { userIds, remove },
	});
}

async function updateProjectUserBillableRate({
	auth,
	workspaceId,
	projectId,
	userId,
	amount,
	since,
	includeApproved,
}: ProjectScope &
	RateParams & { auth: ClockifyAuthValue; userId: string }): Promise<ClockifyProject> {
	return await clockifyClient.request<ClockifyProject>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/projects/${projectId}/users/${userId}/hourly-rate`,
		body: { amount, since, includeApproved },
	});
}

async function updateProjectUserCostRate({
	auth,
	workspaceId,
	projectId,
	userId,
	amount,
	since,
	includeApproved,
}: ProjectScope &
	RateParams & { auth: ClockifyAuthValue; userId: string }): Promise<ClockifyProject> {
	return await clockifyClient.request<ClockifyProject>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/projects/${projectId}/users/${userId}/cost-rate`,
		body: { amount, since, includeApproved },
	});
}

async function updateProjectEstimate({
	auth,
	workspaceId,
	projectId,
	estimate,
}: ProjectScope & {
	auth: ClockifyAuthValue;
	estimate: ProjectEstimateInput;
}): Promise<ClockifyProject> {
	return await clockifyClient.request<ClockifyProject>({
		auth,
		method: HttpMethod.PATCH,
		path: `/workspaces/${workspaceId}/projects/${projectId}/estimate`,
		body: estimate,
	});
}

async function updateProjectTemplate({
	auth,
	workspaceId,
	projectId,
	isTemplate,
}: ProjectScope & { auth: ClockifyAuthValue; isTemplate: boolean }): Promise<ClockifyProject> {
	return await clockifyClient.request<ClockifyProject>({
		auth,
		method: HttpMethod.PATCH,
		path: `/workspaces/${workspaceId}/projects/${projectId}/template`,
		body: { isTemplate },
	});
}

async function listProjectCustomFields({
	auth,
	workspaceId,
	projectId,
	query,
}: ProjectScope & { auth: ClockifyAuthValue; query: QueryParams }): Promise<ClockifyCustomField[]> {
	return await clockifyClient.request<ClockifyCustomField[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/projects/${projectId}/custom-fields`,
		query,
	});
}

async function getTask({
	auth,
	workspaceId,
	projectId,
	taskId,
}: ProjectScope & { auth: ClockifyAuthValue; taskId: string }): Promise<ClockifyTask> {
	return await clockifyClient.request<ClockifyTask>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
	});
}

async function updateTask({
	auth,
	workspaceId,
	projectId,
	taskId,
	task,
}: ProjectScope & {
	auth: ClockifyAuthValue;
	taskId: string;
	task: ClockifyTaskInput;
}): Promise<ClockifyTask> {
	return await clockifyClient.request<ClockifyTask>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
		body: task,
	});
}

async function deleteTask({
	auth,
	workspaceId,
	projectId,
	taskId,
}: ProjectScope & { auth: ClockifyAuthValue; taskId: string }): Promise<ClockifyTask> {
	return await clockifyClient.request<ClockifyTask>({
		auth,
		method: HttpMethod.DELETE,
		path: `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
	});
}

async function updateTaskBillableRate({
	auth,
	workspaceId,
	projectId,
	taskId,
	amount,
	since,
	includeApproved,
}: ProjectScope & RateParams & { auth: ClockifyAuthValue; taskId: string }): Promise<ClockifyTask> {
	return await clockifyClient.request<ClockifyTask>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/hourly-rate`,
		body: { amount, since, includeApproved },
	});
}

async function updateTaskCostRate({
	auth,
	workspaceId,
	projectId,
	taskId,
	amount,
	since,
	includeApproved,
}: ProjectScope & RateParams & { auth: ClockifyAuthValue; taskId: string }): Promise<ClockifyTask> {
	return await clockifyClient.request<ClockifyTask>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/cost-rate`,
		body: { amount, since, includeApproved },
	});
}

async function createUserTimeEntry({
	auth,
	workspaceId,
	userId,
	entry,
}: UserScope & {
	auth: ClockifyAuthValue;
	entry: ClockifyTimeEntryInput;
}): Promise<ClockifyTimeEntry> {
	return await clockifyClient.request<ClockifyTimeEntry>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/user/${userId}/time-entries`,
		body: entry,
	});
}

async function getTimeEntry({
	auth,
	workspaceId,
	timeEntryId,
	query,
}: TimeEntryScope & { auth: ClockifyAuthValue; query: QueryParams }): Promise<ClockifyTimeEntry> {
	return await clockifyClient.request<ClockifyTimeEntry>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/time-entries/${timeEntryId}`,
		query,
	});
}

async function getTimeEntriesByIds({
	auth,
	workspaceId,
	timeEntryIds,
	hydrated,
}: WorkspaceScope & {
	auth: ClockifyAuthValue;
	timeEntryIds: string[];
	hydrated?: boolean;
}): Promise<ClockifyTimeEntry[]> {
	return await clockifyClient.request<ClockifyTimeEntry[]>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/time-entries/batch`,
		body: { timeEntryIds, hydrated },
	});
}

async function updateTimeEntry({
	auth,
	workspaceId,
	timeEntryId,
	entry,
}: TimeEntryScope & {
	auth: ClockifyAuthValue;
	entry: ClockifyTimeEntryInput;
}): Promise<ClockifyTimeEntry> {
	return await clockifyClient.request<ClockifyTimeEntry>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/time-entries/${timeEntryId}`,
		body: entry,
	});
}

async function bulkUpdateTimeEntries({
	auth,
	workspaceId,
	userId,
	entries,
}: UserScope & {
	auth: ClockifyAuthValue;
	entries: (ClockifyTimeEntryInput & { id: string })[];
}): Promise<ClockifyTimeEntry[]> {
	return await clockifyClient.request<ClockifyTimeEntry[]>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/user/${userId}/time-entries`,
		body: entries,
	});
}

async function deleteTimeEntry({
	auth,
	workspaceId,
	timeEntryId,
}: TimeEntryScope & { auth: ClockifyAuthValue }): Promise<void> {
	await clockifyClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/workspaces/${workspaceId}/time-entries/${timeEntryId}`,
	});
}

async function bulkDeleteTimeEntries({
	auth,
	workspaceId,
	userId,
	timeEntryIds,
}: UserScope & { auth: ClockifyAuthValue; timeEntryIds: string[] }): Promise<ClockifyTimeEntry[]> {
	return await clockifyClient.request<ClockifyTimeEntry[]>({
		auth,
		method: HttpMethod.DELETE,
		path: `/workspaces/${workspaceId}/user/${userId}/time-entries`,
		query: { 'time-entry-ids': timeEntryIds.join(',') },
	});
}

async function duplicateTimeEntry({
	auth,
	workspaceId,
	userId,
	timeEntryId,
}: UserScope & { auth: ClockifyAuthValue; timeEntryId: string }): Promise<ClockifyTimeEntry> {
	return await clockifyClient.request<ClockifyTimeEntry>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/user/${userId}/time-entries/${timeEntryId}/duplicate`,
	});
}

async function markTimeEntriesInvoiced({
	auth,
	workspaceId,
	timeEntryIds,
	invoiced,
}: WorkspaceScope & {
	auth: ClockifyAuthValue;
	timeEntryIds: string[];
	invoiced: boolean;
}): Promise<void> {
	await clockifyClient.request<unknown>({
		auth,
		method: HttpMethod.PATCH,
		path: `/workspaces/${workspaceId}/time-entries/invoiced`,
		body: { timeEntryIds, invoiced },
	});
}

async function generateReport({
	auth,
	workspaceId,
	kind,
	report,
}: WorkspaceScope & {
	auth: ClockifyAuthValue;
	kind: ReportKind;
	report: ClockifyReportRequest;
}): Promise<ClockifyReport> {
	return await clockifyClient.request<ClockifyReport>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/reports/${kind}`,
		body: report,
		host: 'reports',
	});
}

async function listSharedReports({
	auth,
	workspaceId,
	query,
}: WorkspaceScope & {
	auth: ClockifyAuthValue;
	query: QueryParams;
}): Promise<ClockifySharedReportPage> {
	return await clockifyClient.request<ClockifySharedReportPage>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/shared-reports`,
		query,
		host: 'reports',
	});
}

async function getSharedReport({
	auth,
	sharedReportId,
	query,
}: {
	auth: ClockifyAuthValue;
	sharedReportId: string;
	query: QueryParams;
}): Promise<ClockifyReport> {
	return await clockifyClient.request<ClockifyReport>({
		auth,
		method: HttpMethod.GET,
		path: `/shared-reports/${sharedReportId}`,
		query,
		host: 'reports',
	});
}

async function createSharedReport({
	auth,
	workspaceId,
	sharedReport,
}: WorkspaceScope & {
	auth: ClockifyAuthValue;
	sharedReport: ClockifySharedReportInput;
}): Promise<ClockifySharedReport> {
	return await clockifyClient.request<ClockifySharedReport>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/shared-reports`,
		body: sharedReport,
		host: 'reports',
	});
}

async function updateSharedReport({
	auth,
	workspaceId,
	sharedReportId,
	sharedReport,
}: WorkspaceScope & {
	auth: ClockifyAuthValue;
	sharedReportId: string;
	sharedReport: ClockifySharedReportUpdate;
}): Promise<ClockifySharedReport> {
	return await clockifyClient.request<ClockifySharedReport>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/shared-reports/${sharedReportId}`,
		body: sharedReport,
		host: 'reports',
	});
}

async function deleteSharedReport({
	auth,
	workspaceId,
	sharedReportId,
}: WorkspaceScope & { auth: ClockifyAuthValue; sharedReportId: string }): Promise<void> {
	await clockifyClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/workspaces/${workspaceId}/shared-reports/${sharedReportId}`,
		host: 'reports',
	});
}

async function listTemplates({
	auth,
	workspaceId,
	query,
}: WorkspaceScope & { auth: ClockifyAuthValue; query: QueryParams }): Promise<ClockifyTemplate[]> {
	return await clockifyClient.request<ClockifyTemplate[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/templates`,
		query,
	});
}

async function getTemplate({
	auth,
	workspaceId,
	templateId,
	query,
}: WorkspaceScope & {
	auth: ClockifyAuthValue;
	templateId: string;
	query: QueryParams;
}): Promise<ClockifyTemplate> {
	return await clockifyClient.request<ClockifyTemplate>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/templates/${templateId}`,
		query,
	});
}

async function createTemplates({
	auth,
	workspaceId,
	templates,
}: WorkspaceScope & { auth: ClockifyAuthValue; templates: TemplateInput[] }): Promise<
	ClockifyTemplate[]
> {
	return await clockifyClient.request<ClockifyTemplate[]>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/templates`,
		body: templates,
	});
}

async function renameTemplate({
	auth,
	workspaceId,
	templateId,
	name,
}: WorkspaceScope & {
	auth: ClockifyAuthValue;
	templateId: string;
	name: string;
}): Promise<ClockifyTemplate> {
	return await clockifyClient.request<ClockifyTemplate>({
		auth,
		method: HttpMethod.PATCH,
		path: `/workspaces/${workspaceId}/templates/${templateId}`,
		body: { name },
	});
}

async function deleteTemplate({
	auth,
	workspaceId,
	templateId,
}: WorkspaceScope & { auth: ClockifyAuthValue; templateId: string }): Promise<ClockifyTemplate> {
	return await clockifyClient.request<ClockifyTemplate>({
		auth,
		method: HttpMethod.DELETE,
		path: `/workspaces/${workspaceId}/templates/${templateId}`,
	});
}

async function listHolidays({
	auth,
	workspaceId,
	query,
}: WorkspaceScope & { auth: ClockifyAuthValue; query: QueryParams }): Promise<ClockifyHoliday[]> {
	return await clockifyClient.request<ClockifyHoliday[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/holidays`,
		query,
	});
}

async function listHolidaysInPeriod({
	auth,
	workspaceId,
	query,
}: WorkspaceScope & { auth: ClockifyAuthValue; query: QueryParams }): Promise<ClockifyHoliday[]> {
	return await clockifyClient.request<ClockifyHoliday[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/holidays/in-period`,
		query,
	});
}

async function createHoliday({
	auth,
	workspaceId,
	holiday,
}: WorkspaceScope & { auth: ClockifyAuthValue; holiday: HolidayInput }): Promise<ClockifyHoliday> {
	return await clockifyClient.request<ClockifyHoliday>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/holidays`,
		body: holiday,
	});
}

async function updateHoliday({
	auth,
	workspaceId,
	holidayId,
	holiday,
}: WorkspaceScope & {
	auth: ClockifyAuthValue;
	holidayId: string;
	holiday: HolidayInput;
}): Promise<ClockifyHoliday> {
	return await clockifyClient.request<ClockifyHoliday>({
		auth,
		method: HttpMethod.PUT,
		path: `/workspaces/${workspaceId}/holidays/${holidayId}`,
		body: holiday,
	});
}

async function deleteHoliday({
	auth,
	workspaceId,
	holidayId,
}: WorkspaceScope & { auth: ClockifyAuthValue; holidayId: string }): Promise<ClockifyHoliday> {
	return await clockifyClient.request<ClockifyHoliday>({
		auth,
		method: HttpMethod.DELETE,
		path: `/workspaces/${workspaceId}/holidays/${holidayId}`,
	});
}

async function listCreatedEntities({
	auth,
	workspaceId,
	query,
}: WorkspaceScope & {
	auth: ClockifyAuthValue;
	query: QueryParams;
}): Promise<unknown> {
	return await clockifyClient.request<unknown>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/entities/created`,
		query,
	});
}

async function listAssignments({
	auth,
	workspaceId,
	query,
}: WorkspaceScope & { auth: ClockifyAuthValue; query: QueryParams }): Promise<
	ClockifyAssignment[]
> {
	return await clockifyClient.request<ClockifyAssignment[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/scheduling/assignments/all`,
		query,
	});
}

async function listCustomFields({
	auth,
	workspaceId,
	query,
}: WorkspaceScope & { auth: ClockifyAuthValue; query: QueryParams }): Promise<
	ClockifyCustomField[]
> {
	return await clockifyClient.request<ClockifyCustomField[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/custom-fields`,
		query,
	});
}

export const clockifyApi = {
	getCurrentUser,
	listWorkspaces,
	listProjects,
	listUsers,
	listTags,
	listTasks,
	createTask,
	createTimeEntry,
	listInProgressTimeEntries,
	listUserTimeEntries,
	stopUserTimer,
	createWebhook,
	deleteWebhook,
	getWorkspace,
	createWorkspace,
	updateWorkspaceBillableRate,
	updateWorkspaceCostRate,
	filterUsers,
	updateUserStatus,
	updateUserBillableRate,
	updateUserCostRate,
	updateUserCustomField,
	listUserManagers,
	addUserRole,
	removeUserRole,
	getMemberProfile,
	updateMemberProfile,
	listUserGroups,
	createUserGroup,
	updateUserGroup,
	deleteUserGroup,
	addUserToGroup,
	removeUserFromGroup,
	listClients,
	getClient,
	createClient,
	updateClient,
	deleteClient,
	getTag,
	createTag,
	updateTag,
	deleteTag,
	getProject,
	createProject,
	createProjectFromTemplate,
	updateProject,
	deleteProject,
	replaceProjectMemberships,
	assignProjectUsers,
	updateProjectUserBillableRate,
	updateProjectUserCostRate,
	updateProjectEstimate,
	updateProjectTemplate,
	listProjectCustomFields,
	getTask,
	updateTask,
	deleteTask,
	updateTaskBillableRate,
	updateTaskCostRate,
	createUserTimeEntry,
	getTimeEntry,
	getTimeEntriesByIds,
	updateTimeEntry,
	bulkUpdateTimeEntries,
	deleteTimeEntry,
	bulkDeleteTimeEntries,
	duplicateTimeEntry,
	markTimeEntriesInvoiced,
	generateReport,
	listSharedReports,
	getSharedReport,
	createSharedReport,
	updateSharedReport,
	deleteSharedReport,
	listTemplates,
	getTemplate,
	createTemplates,
	renameTemplate,
	deleteTemplate,
	listHolidays,
	listHolidaysInPeriod,
	createHoliday,
	updateHoliday,
	deleteHoliday,
	listCreatedEntities,
	listAssignments,
	listCustomFields,
};

type CreateTaskParams = {
	workspaceId: string;
	projectId: string;
	name: string;
	status?: string;
	assigneeIds: string[];
	estimate?: string;
	userGroupIds?: string[];
};

type CreateTimeEntryParams = {
	workspaceId: string;
	billable?: boolean;
	description?: string;
	start: string;
	end?: string;
	projectId?: string;
	taskId?: string;
	tagIds: string[];
};

type CreateWebhookParams = {
	workspaceId: string;
	url: string;
	webhookEvent: string;
	triggerSourceType?: string;
	triggerSource?: string[];
};

type WorkspaceScope = { workspaceId: string };

type UserScope = WorkspaceScope & { userId: string };

type ProjectScope = WorkspaceScope & { projectId: string };

type TimeEntryScope = WorkspaceScope & { timeEntryId: string };

type UserGroupScope = WorkspaceScope & { userGroupId: string };

type RateParams = { amount: number; since?: string; includeApproved?: boolean };

type RoleParams = { role: string; entityId: string; sourceType?: string };

type UserFilter = {
	email?: string;
	name?: string;
	status?: string;
	projectId?: string;
	userGroups?: string[];
	roles?: string[];
	includeRoles?: boolean;
	sortColumn?: string;
	sortOrder?: string;
	page: number;
	pageSize: number;
};

type MemberProfileChanges = {
	name?: string;
	weekStart?: string;
	workCapacity?: string;
	workingDays?: string[];
};

type ProjectFromTemplateInput = {
	name: string;
	templateProjectId: string;
	clientId?: string;
	color?: string;
	isPublic?: boolean;
};

type ProjectEstimateInput = {
	timeEstimate?: {
		active: boolean;
		estimate?: string;
		type: string;
		resetOption?: string;
		includeNonBillable?: boolean;
	};
	budgetEstimate?: { active: boolean; estimate?: number; type: string; resetOption?: string };
};

type ReportKind = 'detailed' | 'summary' | 'weekly' | 'attendance' | 'expenses/detailed';

type TemplateInput = {
	name: string;
	projectsAndTasks: { projectId: string; taskId?: string }[];
	weekStart?: string;
};

type HolidayInput = {
	name: string;
	datePeriod: { startDate: string; endDate: string };
	occursAnnually: boolean;
	everyoneIncludingNew: boolean;
	users?: ClockifyEntityFilter;
	userGroups?: ClockifyEntityFilter;
	automaticTimeEntryCreation?: unknown;
};
