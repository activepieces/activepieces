import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { opnformClient } from './client';

import type {
	OpnformAuthValue,
	OpnformCreateIntegrationResponse,
	OpnformExportResponse,
	OpnformForm,
	OpnformFormDetail,
	OpnformFormPage,
	OpnformIntegration,
	OpnformMessage,
	OpnformPage,
	OpnformSubmission,
	OpnformWorkspace,
	OpnformWorkspaceInvite,
	OpnformWorkspaceUser,
} from './types';

async function getCurrentUser({ auth }: { auth: OpnformAuthValue }): Promise<unknown> {
	return await opnformClient.request<unknown>({
		auth,
		method: HttpMethod.GET,
		path: '/external/zapier/validate',
	});
}

async function listWorkspaces({ auth }: { auth: OpnformAuthValue }): Promise<OpnformWorkspace[]> {
	return await opnformClient.request<OpnformWorkspace[]>({
		auth,
		method: HttpMethod.GET,
		path: '/open/workspaces',
	});
}

async function updateWorkspace({
	auth,
	workspaceId,
	name,
	emoji,
}: {
	auth: OpnformAuthValue;
	workspaceId: string;
	name: string;
	emoji?: string;
}): Promise<OpnformWorkspace> {
	return await opnformClient.request<OpnformWorkspace>({
		auth,
		method: HttpMethod.PUT,
		path: `/open/workspaces/${workspaceId}`,
		body: { name, ...(emoji !== undefined ? { emoji } : {}) },
	});
}

async function listWorkspaceUsers({
	auth,
	workspaceId,
}: {
	auth: OpnformAuthValue;
	workspaceId: string;
}): Promise<OpnformWorkspaceUser[]> {
	return await opnformClient.request<OpnformWorkspaceUser[]>({
		auth,
		method: HttpMethod.GET,
		path: `/open/workspaces/${workspaceId}/users`,
	});
}

async function updateWorkspaceUserRole({
	auth,
	workspaceId,
	userId,
	role,
}: {
	auth: OpnformAuthValue;
	workspaceId: string;
	userId: string;
	role: string;
}): Promise<OpnformMessage> {
	return await opnformClient.request<OpnformMessage>({
		auth,
		method: HttpMethod.PUT,
		path: `/open/workspaces/${workspaceId}/users/${userId}/update-role`,
		body: { role },
	});
}

async function listWorkspaceInvites({
	auth,
	workspaceId,
}: {
	auth: OpnformAuthValue;
	workspaceId: string;
}): Promise<OpnformWorkspaceInvite[]> {
	return await opnformClient.request<OpnformWorkspaceInvite[]>({
		auth,
		method: HttpMethod.GET,
		path: `/open/workspaces/${workspaceId}/invites`,
	});
}

async function listForms({
	auth,
	workspaceId,
}: {
	auth: OpnformAuthValue;
	workspaceId: string;
}): Promise<OpnformForm[]> {
	const forms: OpnformForm[] = [];
	let hasMore = true;
	let page = 1;
	do {
		const response = await opnformClient.request<OpnformFormPage>({
			auth,
			method: HttpMethod.GET,
			path: `/open/workspaces/${workspaceId}/forms`,
			query: { page: page.toString() },
		});
		forms.push(...response.data);
		hasMore = response.meta != undefined && response.meta.current_page < response.meta.last_page;
		page++;
	} while (hasMore);
	return forms;
}

async function listWorkspaceForms({
	auth,
	workspaceId,
	page,
	perPage,
}: {
	auth: OpnformAuthValue;
	workspaceId: string;
	page?: number;
	perPage?: number;
}): Promise<OpnformPage<Record<string, unknown>>> {
	return await opnformClient.request<OpnformPage<Record<string, unknown>>>({
		auth,
		method: HttpMethod.GET,
		path: `/open/workspaces/${workspaceId}/forms`,
		query: pageQuery({ page, perPage }),
	});
}

async function getForm({
	auth,
	formSlug,
}: {
	auth: OpnformAuthValue;
	formSlug: string;
}): Promise<OpnformFormDetail> {
	return await opnformClient.request<OpnformFormDetail>({
		auth,
		method: HttpMethod.GET,
		path: `/open/forms/${formSlug}`,
	});
}

async function createForm({
	auth,
	body,
}: {
	auth: OpnformAuthValue;
	body: Record<string, unknown>;
}): Promise<OpnformFormDetail> {
	return await opnformClient.request<OpnformFormDetail>({
		auth,
		method: HttpMethod.POST,
		path: '/open/forms',
		body,
	});
}

async function updateForm({
	auth,
	formId,
	body,
}: {
	auth: OpnformAuthValue;
	formId: string;
	body: Record<string, unknown>;
}): Promise<OpnformFormDetail> {
	return await opnformClient.request<OpnformFormDetail>({
		auth,
		method: HttpMethod.PUT,
		path: `/open/forms/${formId}`,
		body,
	});
}

async function deleteForm({
	auth,
	formId,
}: {
	auth: OpnformAuthValue;
	formId: string;
}): Promise<void> {
	await opnformClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/open/forms/${formId}`,
	});
}

async function listSubmissions({
	auth,
	formId,
	page,
	perPage,
	search,
	status,
}: {
	auth: OpnformAuthValue;
	formId: string;
	page?: number;
	perPage?: number;
	search?: string;
	status?: string;
}): Promise<OpnformPage<OpnformSubmission>> {
	return await opnformClient.request<OpnformPage<OpnformSubmission>>({
		auth,
		method: HttpMethod.GET,
		path: `/open/forms/${formId}/submissions`,
		query: {
			...pageQuery({ page, perPage }),
			...(search ? { search } : {}),
			...(status ? { status } : {}),
		},
	});
}

async function createSubmission({
	auth,
	formSlug,
	body,
}: {
	auth: OpnformAuthValue;
	formSlug: string;
	body: Record<string, unknown>;
}): Promise<unknown> {
	return await opnformClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: `/forms/${formSlug}/answer`,
		body,
	});
}

async function updateSubmission({
	auth,
	formId,
	submissionId,
	body,
}: {
	auth: OpnformAuthValue;
	formId: string;
	submissionId: string;
	body: Record<string, unknown>;
}): Promise<unknown> {
	return await opnformClient.request<unknown>({
		auth,
		method: HttpMethod.PUT,
		path: `/open/forms/${formId}/submissions/${submissionId}`,
		body,
	});
}

async function deleteSubmission({
	auth,
	formId,
	submissionId,
}: {
	auth: OpnformAuthValue;
	formId: string;
	submissionId: string;
}): Promise<OpnformMessage> {
	return await opnformClient.request<OpnformMessage>({
		auth,
		method: HttpMethod.DELETE,
		path: `/open/forms/${formId}/submissions/${submissionId}`,
	});
}

async function exportSubmissions({
	auth,
	formId,
	columns,
}: {
	auth: OpnformAuthValue;
	formId: string;
	columns: Record<string, unknown>;
}): Promise<OpnformExportResponse> {
	return await opnformClient.request<OpnformExportResponse>({
		auth,
		method: HttpMethod.POST,
		path: `/open/forms/${formId}/submissions/export`,
		body: { columns },
	});
}

async function listIntegrations({
	auth,
	formId,
}: {
	auth: OpnformAuthValue;
	formId: string;
}): Promise<OpnformIntegration[]> {
	return await opnformClient.request<OpnformIntegration[]>({
		auth,
		method: HttpMethod.GET,
		path: `/open/forms/${formId}/integrations`,
	});
}

async function createIntegration({
	auth,
	formId,
	webhookUrl,
	flowUrl,
}: {
	auth: OpnformAuthValue;
	formId: string;
	webhookUrl: string;
	flowUrl: string;
}): Promise<number | null> {
	const response = await opnformClient.request<OpnformCreateIntegrationResponse>({
		auth,
		method: HttpMethod.POST,
		path: `/open/forms/${formId}/integrations`,
		headers: { 'Content-Type': 'application/json' },
		body: {
			integration_id: 'activepieces',
			status: 'active',
			data: {
				webhook_url: webhookUrl,
				provider_url: flowUrl,
			},
		},
		query: {},
	});
	return response.form_integration.id || null;
}

async function deleteIntegration({
	auth,
	formId,
	integrationId,
}: {
	auth: OpnformAuthValue;
	formId: string;
	integrationId: number;
}): Promise<void> {
	await opnformClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/open/forms/${formId}/integrations/${integrationId}`,
		headers: { 'Content-Type': 'application/json' },
	});
}

function pageQuery({ page, perPage }: { page?: number; perPage?: number }): QueryParams {
	return {
		...(page !== undefined ? { page: String(page) } : {}),
		...(perPage !== undefined ? { per_page: String(perPage) } : {}),
	};
}

export const opnformApi = {
	getCurrentUser,
	listWorkspaces,
	updateWorkspace,
	listWorkspaceUsers,
	updateWorkspaceUserRole,
	listWorkspaceInvites,
	listForms,
	listWorkspaceForms,
	getForm,
	createForm,
	updateForm,
	deleteForm,
	listSubmissions,
	createSubmission,
	updateSubmission,
	deleteSubmission,
	exportSubmissions,
	listIntegrations,
	createIntegration,
	deleteIntegration,
};
