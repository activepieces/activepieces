import { createHmac } from 'node:crypto';

import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { robollyClient } from './client';

import type {
	RobollyAcceptedModification,
	RobollyAcceptedModificationsResponse,
	RobollyAuthValue,
	RobollyRender,
	RobollyRendersPage,
	RobollyTemplate,
	RobollyTemplateFields,
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

async function getAcceptedModifications({
	auth,
	templateId,
}: {
	auth: RobollyAuthValue;
	templateId: string;
}): Promise<RobollyAcceptedModificationsResponse> {
	return await robollyClient.request<RobollyAcceptedModificationsResponse>({
		auth,
		method: HttpMethod.GET,
		path: `/v1/templates/${templateId}/accepted-modifications`,
	});
}

async function listAcceptedModifications({
	auth,
	templateId,
}: {
	auth: RobollyAuthValue;
	templateId: string;
}): Promise<RobollyAcceptedModification[]> {
	const response = await getAcceptedModifications({ auth, templateId });
	return response.acceptedModifications;
}

async function listGalleryTemplates({
	auth,
	cursor,
}: {
	auth: RobollyAuthValue;
	cursor: string | undefined;
}): Promise<unknown> {
	return await robollyClient.request<unknown>({
		auth,
		method: HttpMethod.GET,
		path: '/v1/templates-gallery',
		query: toQuery({ values: { paginationCursorNext: cursor } }),
	});
}

async function createTemplate({
	auth,
	fields,
}: {
	auth: RobollyAuthValue;
	fields: RobollyTemplateFields & { name: string };
}): Promise<unknown> {
	return await robollyClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: '/v1/templates',
		body: definedOnly({ values: fields }),
	});
}

async function updateTemplate({
	auth,
	templateId,
	fields,
}: {
	auth: RobollyAuthValue;
	templateId: string;
	fields: RobollyTemplateFields;
}): Promise<void> {
	await robollyClient.request<unknown>({
		auth,
		method: HttpMethod.PATCH,
		path: `/v1/templates/${templateId}`,
		body: definedOnly({ values: fields }),
	});
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

async function renderTemplateLink({
	auth,
	templateId,
	format,
	modifications,
	options,
}: RenderTemplateLinkParams): Promise<unknown> {
	return await robollyClient.request<unknown>({
		auth,
		method: HttpMethod.GET,
		path: `/templates/${templateId}/render.${format}`,
		query: {
			...toQuery({ values: modifications ?? {} }),
			...toQuery({ values: options }),
			json: '1',
		},
	});
}

function createHiddenRenderLink({
	auth,
	templateId,
	format,
	modifications,
}: {
	auth: RobollyAuthValue;
	templateId: string;
	format: string;
	modifications: Record<string, unknown> | undefined;
}): { url: string } {
	const unsignedQuery = new URLSearchParams({
		template: templateId,
		...toQuery({ values: modifications ?? {} }),
	}).toString();
	const sig = createHmac('sha256', auth.secret_text)
		.update(`${templateId}:${format}:${unsignedQuery}`)
		.digest('hex');
	const query = `${unsignedQuery}&sig=${sig}`;
	const encoded = Buffer.from(query, 'utf8').toString('base64url');
	return { url: `${robollyClient.baseUrl()}/rd/${encoded}.${format}` };
}

async function listRenders({
	auth,
	renderId,
	cursor,
	templateId,
	movieId,
	cacheHash,
}: {
	auth: RobollyAuthValue;
	renderId?: string;
	cursor?: string;
	templateId?: string;
	movieId?: string;
	cacheHash?: string;
}): Promise<RobollyRendersPage> {
	return await robollyClient.request<RobollyRendersPage>({
		auth,
		method: HttpMethod.GET,
		path: '/v1/renders',
		query: toQuery({
			values: {
				id: renderId,
				paginationCursorNext: cursor,
				filterTemplateIds: templateId,
				filterMovieIds: movieId,
				cacheHash,
			},
		}),
	});
}

async function getRender({
	auth,
	renderId,
}: {
	auth: RobollyAuthValue;
	renderId: string;
}): Promise<RobollyRender> {
	const page = await listRenders({ auth, renderId });
	const render = (page.data ?? page.value ?? [])[0];
	if (!render) {
		throw new Error(`Render "${renderId}" was not found.`);
	}
	return render;
}

function definedOnly({ values }: { values: Record<string, unknown> }): Record<string, unknown> {
	return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}

function toQuery({ values }: { values: Record<string, unknown> }): QueryParams {
	return Object.fromEntries(
		Object.entries(values)
			.filter(([, value]) => value !== undefined)
			.map(([key, value]) => [key, String(value)]),
	);
}

export const robollyApi = {
	listTemplates,
	getAcceptedModifications,
	listAcceptedModifications,
	listGalleryTemplates,
	createTemplate,
	updateTemplate,
	renderTemplate,
	renderTemplateLink,
	createHiddenRenderLink,
	listRenders,
	getRender,
};

type RenderTemplateParams = {
	auth: RobollyAuthValue;
	templateId: string;
	format: string;
	modifications: Record<string, unknown> | undefined;
	fields: Record<string, unknown>;
};

type RenderTemplateLinkParams = {
	auth: RobollyAuthValue;
	templateId: string;
	format: string;
	modifications: Record<string, unknown> | undefined;
	options: { scale?: number; q?: number; dpi?: number; fps?: number; duration?: number };
};
