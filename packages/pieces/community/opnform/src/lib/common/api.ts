import { HttpMethod } from '@activepieces/pieces-common';

import { opnformClient } from './client';

import type {
	OpnformAuthValue,
	OpnformCreateIntegrationResponse,
	OpnformForm,
	OpnformFormPage,
	OpnformIntegration,
	OpnformWorkspace,
} from './types';

async function listWorkspaces({ auth }: { auth: OpnformAuthValue }): Promise<OpnformWorkspace[]> {
	return await opnformClient.request<OpnformWorkspace[]>({
		auth,
		method: HttpMethod.GET,
		path: '/open/workspaces',
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

export const opnformApi = {
	listWorkspaces,
	listForms,
	listIntegrations,
	createIntegration,
	deleteIntegration,
};
