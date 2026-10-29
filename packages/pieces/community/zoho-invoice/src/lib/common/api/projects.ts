import { HttpMethod } from '@activepieces/pieces-common';

import { zohoInvoiceClient } from '../client';
import { zohoInvoiceUtils } from '../utils';

import type { ZohoInvoiceAuthValue, ZohoInvoiceOrgScope, ZohoInvoiceResponse } from '../types';

async function createProject({
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
		path: '/projects',
		body,
	});
}

async function listProjects({
	auth,
	organizationId,
	filterBy,
	customerId,
	sortColumn,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	filterBy?: string;
	customerId?: string;
	sortColumn?: string;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/projects',
		query: zohoInvoiceUtils.toQuery({
			filter_by: filterBy,
			customer_id: customerId,
			sort_column: sortColumn,
			page,
			per_page: perPage,
		}),
	});
}

async function getProject({
	auth,
	organizationId,
	projectId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
}): Promise<ZohoInvoiceProjectResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceProjectResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/projects/${projectId}`,
	});
}

async function updateProject({
	auth,
	organizationId,
	projectId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/projects/${projectId}`,
		body,
	});
}

async function deleteProject({
	auth,
	organizationId,
	projectId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/projects/${projectId}`,
	});
}

async function cloneProject({
	auth,
	organizationId,
	projectId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/projects/${projectId}/clone`,
		body,
	});
}

async function activateProject({
	auth,
	organizationId,
	projectId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/projects/${projectId}/active`,
	});
}

async function deactivateProject({
	auth,
	organizationId,
	projectId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/projects/${projectId}/inactive`,
	});
}

async function listProjectInvoices({
	auth,
	organizationId,
	projectId,
	sortColumn,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
	sortColumn?: string;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/projects/${projectId}/invoices`,
		query: zohoInvoiceUtils.toQuery({
			sort_column: sortColumn,
			page,
			per_page: perPage,
		}),
	});
}

async function listProjectComments({
	auth,
	organizationId,
	projectId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/projects/${projectId}/comments`,
	});
}

async function addProjectComment({
	auth,
	organizationId,
	projectId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/projects/${projectId}/comments`,
		body,
	});
}

async function deleteProjectComment({
	auth,
	organizationId,
	projectId,
	commentId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
	commentId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/projects/${projectId}/comments/${commentId}`,
	});
}

async function createProjectTask({
	auth,
	organizationId,
	projectId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/projects/${projectId}/tasks`,
		body,
	});
}

async function listProjectTasks({
	auth,
	organizationId,
	projectId,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/projects/${projectId}/tasks`,
		query: zohoInvoiceUtils.toQuery({ page, per_page: perPage }),
	});
}

async function getProjectTask({
	auth,
	organizationId,
	projectId,
	taskId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
	taskId: string;
}): Promise<ZohoInvoiceProjectTaskResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceProjectTaskResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/projects/${projectId}/tasks/${taskId}`,
	});
}

async function updateProjectTask({
	auth,
	organizationId,
	projectId,
	taskId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
	taskId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/projects/${projectId}/tasks/${taskId}`,
		body,
	});
}

async function deleteProjectTask({
	auth,
	organizationId,
	projectId,
	taskId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
	taskId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/projects/${projectId}/tasks/${taskId}`,
	});
}

async function listProjectUsers({
	auth,
	organizationId,
	projectId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/projects/${projectId}/users`,
	});
}

async function getProjectUser({
	auth,
	organizationId,
	projectId,
	userId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
	userId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/projects/${projectId}/users/${userId}`,
	});
}

async function updateProjectUser({
	auth,
	organizationId,
	projectId,
	userId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	projectId: string;
	userId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/projects/${projectId}/users/${userId}`,
		body,
	});
}

async function createTimeEntry({
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
		path: '/projects/timeentries',
		body,
	});
}

async function listTimeEntries({
	auth,
	organizationId,
	fromDate,
	toDate,
	filterBy,
	projectId,
	userId,
	sortColumn,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	fromDate?: string;
	toDate?: string;
	filterBy?: string;
	projectId?: string;
	userId?: string;
	sortColumn?: string;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/projects/timeentries',
		query: zohoInvoiceUtils.toQuery({
			from_date: fromDate,
			to_date: toDate,
			filter_by: filterBy,
			project_id: projectId,
			user_id: userId,
			sort_column: sortColumn,
			page,
			per_page: perPage,
		}),
	});
}

async function getTimeEntry({
	auth,
	organizationId,
	timeEntryId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	timeEntryId: string;
}): Promise<ZohoInvoiceTimeEntryResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceTimeEntryResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: `/projects/timeentries/${timeEntryId}`,
	});
}

async function updateTimeEntry({
	auth,
	organizationId,
	timeEntryId,
	body,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	timeEntryId: string;
	body: Record<string, unknown>;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.PUT,
		path: `/projects/timeentries/${timeEntryId}`,
		body,
	});
}

async function deleteTimeEntry({
	auth,
	organizationId,
	timeEntryId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	timeEntryId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/projects/timeentries/${timeEntryId}`,
	});
}

async function startTimeEntryTimer({
	auth,
	organizationId,
	timeEntryId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	timeEntryId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: `/projects/timeentries/${timeEntryId}/timer/start`,
	});
}

async function stopTimeEntryTimer({
	auth,
	organizationId,
}: ZohoInvoiceOrgScope & { auth: ZohoInvoiceAuthValue }): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.POST,
		path: '/projects/timeentries/timer/stop',
	});
}

async function getRunningTimeEntryTimer({
	auth,
	organizationId,
}: ZohoInvoiceOrgScope & { auth: ZohoInvoiceAuthValue }): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/projects/timeentries/runningtimer/me',
	});
}

async function createEmployee({
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
		path: '/employees',
		body,
	});
}

async function listEmployees({
	auth,
	organizationId,
	page,
	perPage,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	page?: number;
	perPage?: number;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.GET,
		path: '/employees',
		query: zohoInvoiceUtils.toQuery({ page, per_page: perPage }),
	});
}

async function deleteEmployee({
	auth,
	organizationId,
	employeeId,
}: ZohoInvoiceOrgScope & {
	auth: ZohoInvoiceAuthValue;
	employeeId: string;
}): Promise<ZohoInvoiceResponse> {
	return await zohoInvoiceClient.request<ZohoInvoiceResponse>({
		auth,
		organizationId,
		method: HttpMethod.DELETE,
		path: `/employees/${employeeId}`,
	});
}

export const projectsApi = {
	createProject,
	listProjects,
	getProject,
	updateProject,
	deleteProject,
	cloneProject,
	activateProject,
	deactivateProject,
	listProjectInvoices,
	listProjectComments,
	addProjectComment,
	deleteProjectComment,
	createProjectTask,
	listProjectTasks,
	getProjectTask,
	updateProjectTask,
	deleteProjectTask,
	listProjectUsers,
	getProjectUser,
	updateProjectUser,
	createTimeEntry,
	listTimeEntries,
	getTimeEntry,
	updateTimeEntry,
	deleteTimeEntry,
	startTimeEntryTimer,
	stopTimeEntryTimer,
	getRunningTimeEntryTimer,
	createEmployee,
	listEmployees,
	deleteEmployee,
};

export type ZohoInvoiceProjectResponse = ZohoInvoiceResponse & {
	project?: {
		project_name?: string;
		customer_id?: string;
		description?: string;
		billing_type?: string;
		budget_type?: string;
		rate?: string | number;
		users?: { user_id?: string }[];
	};
};

export type ZohoInvoiceProjectTaskResponse = ZohoInvoiceResponse & {
	task?: {
		task_name?: string;
		description?: string;
		rate?: string | number;
	};
};

export type ZohoInvoiceTimeEntryResponse = ZohoInvoiceResponse & {
	time_entry?: {
		project_id?: string;
		task_id?: string;
		user_id?: string;
		log_date?: string;
		log_time?: string;
		is_billable?: boolean;
		notes?: string;
	};
};
