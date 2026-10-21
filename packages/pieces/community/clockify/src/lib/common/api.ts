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
} from './types';

async function getCurrentUser({ auth }: { auth: ClockifyAuthValue }): Promise<ClockifyUser> {
	return await clockifyClient.request<ClockifyUser>({
		auth,
		method: HttpMethod.GET,
		path: '/user',
	});
}

async function listWorkspaces({ auth }: { auth: ClockifyAuthValue }): Promise<ClockifyWorkspace[]> {
	return await clockifyClient.request<ClockifyWorkspace[]>({
		auth,
		method: HttpMethod.GET,
		path: '/workspaces',
	});
}

async function listProjects({
	auth,
	workspaceId,
}: {
	auth: ClockifyAuthValue;
	workspaceId: string;
}): Promise<ClockifyProject[]> {
	return await clockifyClient.request<ClockifyProject[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/projects`,
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
}: {
	auth: ClockifyAuthValue;
	workspaceId: string;
}): Promise<ClockifyTag[]> {
	return await clockifyClient.request<ClockifyTag[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/tags`,
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
}: CreateTaskParams & { auth: ClockifyAuthValue }): Promise<ClockifyTask> {
	return await clockifyClient.request<ClockifyTask>({
		auth,
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
		body: {
			name,
			status,
			assigneeIds,
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
}: {
	auth: ClockifyAuthValue;
	workspaceId: string;
}): Promise<ClockifyTimeEntry[]> {
	return await clockifyClient.request<ClockifyTimeEntry[]>({
		auth,
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/time-entries/status/in-progress`,
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
};

type CreateTaskParams = {
	workspaceId: string;
	projectId: string;
	name: string;
	status?: string;
	assigneeIds: string[];
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
