import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { robollyClient } from './client';

import type {
	RobollyAcceptedModification,
	RobollyAcceptedModificationsResponse,
	RobollyAuthValue,
	RobollyTemplate,
	RobollyTemplatesResponse,
} from './types';

async function listTemplates({ auth }: { auth: RobollyAuthValue }): Promise<RobollyTemplate[]> {
	const response = await robollyClient.request<RobollyTemplatesResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/v1/templates',
	});
	return response.templates;
}

async function listAcceptedModifications({
	auth,
	templateId,
}: {
	auth: RobollyAuthValue;
	templateId: string;
}): Promise<RobollyAcceptedModification[]> {
	const response = await robollyClient.request<RobollyAcceptedModificationsResponse>({
		auth,
		method: HttpMethod.GET,
		path: `/v1/templates/${templateId}/accepted-modifications`,
	});
	return response.acceptedModifications;
}

async function renderTemplate({
	auth,
	templateId,
	format,
	modifications,
	fields,
}: RenderTemplateParams): Promise<unknown> {
	const query: QueryParams = {
		json: '',
		...Object.fromEntries(
			Object.entries(modifications ?? {}).map(([key, value]) => [key, String(value)]),
		),
		...Object.fromEntries(
			Object.entries(fields)
				.filter(([, value]) => value !== '')
				.map(([key, value]) => [key, String(value)]),
		),
	};
	return await robollyClient.request<unknown>({
		auth,
		method: HttpMethod.GET,
		path: `/templates/${templateId}/render/${format}`,
		query,
		body: modifications,
	});
}

export const robollyApi = { listTemplates, listAcceptedModifications, renderTemplate };

type RenderTemplateParams = {
	auth: RobollyAuthValue;
	templateId: string;
	format: string;
	modifications: Record<string, unknown> | undefined;
	fields: Record<string, unknown>;
};
