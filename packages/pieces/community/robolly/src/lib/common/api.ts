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

async function listGalleryTemplates({ auth }: { auth: RobollyAuthValue }): Promise<unknown> {
	return await robollyClient.request<unknown>({
		auth,
		method: HttpMethod.GET,
		path: '/v1/templates-gallery',
	});
}

async function createTemplate({
	auth,
	template,
}: {
	auth: RobollyAuthValue;
	template: Record<string, unknown>;
}): Promise<unknown> {
	return await robollyClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: '/v1/templates',
		body: template,
	});
}

async function updateTemplate({
	auth,
	templateId,
	changes,
}: {
	auth: RobollyAuthValue;
	templateId: string;
	changes: Record<string, unknown>;
}): Promise<unknown> {
	return await robollyClient.request<unknown>({
		auth,
		method: HttpMethod.PATCH,
		path: `/v1/templates/${templateId}`,
		body: changes,
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

async function renderMultiPagePdf({
	auth,
	multipdfId,
	pages,
}: {
	auth: RobollyAuthValue;
	multipdfId: string;
	pages: Record<string, unknown>[];
}): Promise<unknown> {
	const pageQuery = pages.flatMap((page, index) =>
		Object.entries(toQuery({ values: page })).map(([key, value]) => [`t[${index}][${key}]`, value]),
	);
	return await robollyClient.request<unknown>({
		auth,
		method: HttpMethod.GET,
		path: '/v1/pdf/render/',
		query: { multipdfId, ...Object.fromEntries(pageQuery), json: '1' },
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
	const modificationQuery = new URLSearchParams(
		toQuery({ values: modifications ?? {} }),
	).toString();
	const sig = createHmac('sha256', auth.secret_text)
		.update(`${templateId}:${format}:${modificationQuery}`)
		.digest('hex');
	const query = new URLSearchParams({
		template: templateId,
		...toQuery({ values: modifications ?? {} }),
		sig,
	}).toString();
	const encoded = Buffer.from(query, 'utf8').toString('base64url');
	return { url: `${robollyClient.baseUrl()}/rd/${encoded}.${format}` };
}

async function renderVideo({
	auth,
	timeline,
	audio,
	fps,
	movieId,
}: {
	auth: RobollyAuthValue;
	timeline: unknown;
	audio: unknown;
	fps: number | undefined;
	movieId: string | undefined;
}): Promise<unknown> {
	return await robollyClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: '/v1/video/render',
		body: {
			timeline,
			...(audio !== undefined ? { audio } : {}),
			...(fps !== undefined ? { fps } : {}),
			...(movieId !== undefined ? { movieId } : {}),
		},
	});
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
	renderMultiPagePdf,
	createHiddenRenderLink,
	renderVideo,
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
