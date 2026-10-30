import FormData from 'form-data';

import { HttpMethod } from '@activepieces/pieces-common';

import { imageRouterClient } from './client';

import type {
	ImageRouterAuthValue,
	ImageRouterEditImageOptions,
	ImageRouterImageOptions,
	ImageRouterImageResponse,
	ImageRouterModels,
} from './types';

async function generateImage({
	auth,
	prompt,
	model,
	quality,
	size,
	responseFormat,
}: ImageRouterImageOptions & { auth: ImageRouterAuthValue }): Promise<ImageRouterImageResponse> {
	return await imageRouterClient.request<ImageRouterImageResponse>({
		auth,
		method: HttpMethod.POST,
		path: '/v1/openai/images/generations',
		body: {
			prompt,
			model,
			...(quality && quality !== 'auto' ? { quality } : {}),
			...(size && size !== 'auto' ? { size } : {}),
			...(responseFormat && responseFormat !== 'url' ? { response_format: responseFormat } : {}),
		},
	});
}

async function editImage({
	auth,
	prompt,
	model,
	images,
	masks,
	quality,
	size,
	responseFormat,
}: ImageRouterEditImageOptions & {
	auth: ImageRouterAuthValue;
}): Promise<ImageRouterImageResponse> {
	const formData = new FormData();
	formData.append('prompt', prompt);
	formData.append('model', model);
	for (const image of images) {
		formData.append('image[]', Buffer.from(image.data), image.filename);
	}
	for (const mask of masks) {
		formData.append('mask[]', Buffer.from(mask.data), mask.filename);
	}
	if (quality && quality !== 'auto') {
		formData.append('quality', quality);
	}
	if (size && size !== 'auto') {
		formData.append('size', size);
	}
	if (responseFormat && responseFormat !== 'url') {
		formData.append('response_format', responseFormat);
	}
	return await imageRouterClient.upload<ImageRouterImageResponse>({
		auth,
		path: '/v1/openai/images/edits',
		form: formData,
	});
}

async function listImageModels({
	auth,
}: {
	auth: ImageRouterAuthValue;
}): Promise<ImageRouterModels> {
	return await imageRouterClient.request<ImageRouterModels>({
		auth,
		method: HttpMethod.GET,
		path: '/v1/models?type=image',
	});
}

async function downloadFile({ url }: { url: string }): Promise<Buffer> {
	return await imageRouterClient.download({ url });
}

async function createImage({
	auth,
	model,
	prompt,
	images,
	masks,
	quality,
	size,
	outputFormat,
}: CreateImageParams) {
	return await imageRouterClient.request<Record<string, unknown>>({
		auth,
		method: HttpMethod.POST,
		path: '/v1/openai/images/generations',
		body: {
			model,
			prompt,
			image: images,
			mask: masks,
			quality,
			size,
			output_format: outputFormat,
			response_format: 'url',
		},
	});
}

async function createVideo({ auth, model, prompt, image, size, seconds }: CreateVideoParams) {
	return await imageRouterClient.request<Record<string, unknown>>({
		auth,
		method: HttpMethod.POST,
		path: '/v1/openai/videos/generations',
		body: { model, prompt, image, size, seconds, response_format: 'url' },
	});
}

async function createChatCompletion({
	auth,
	body,
}: {
	auth: ImageRouterAuthValue;
	body: Record<string, unknown>;
}) {
	return await imageRouterClient.request<Record<string, unknown>>({
		auth,
		method: HttpMethod.POST,
		path: '/v1/openai/chat/completions',
		body: { ...body, stream: false },
	});
}

async function createResponse({
	auth,
	body,
}: {
	auth: ImageRouterAuthValue;
	body: Record<string, unknown>;
}) {
	return await imageRouterClient.request<Record<string, unknown>>({
		auth,
		method: HttpMethod.POST,
		path: '/v1/openai/responses',
		body: { ...body, stream: false },
	});
}

async function listModels({
	auth,
	query,
}: {
	auth: ImageRouterAuthValue;
	query: Record<string, string | undefined>;
}) {
	return await imageRouterClient.request<unknown[]>({
		auth,
		method: HttpMethod.GET,
		path: '/v3/models',
		query: Object.fromEntries(
			Object.entries(query).filter((entry): entry is [string, string] => entry[1] !== undefined),
		),
	});
}

async function getModel({ auth, modelId }: { auth: ImageRouterAuthValue; modelId: string }) {
	return await imageRouterClient.request<Record<string, unknown>>({
		auth,
		method: HttpMethod.GET,
		path: `/v3/models/${encodeURIComponent(modelId)}`,
	});
}

async function getCredits({ auth, byApiKey }: { auth: ImageRouterAuthValue; byApiKey: boolean }) {
	return await imageRouterClient.request<Record<string, unknown>>({
		auth,
		method: HttpMethod.GET,
		path: '/v1/credits',
		query: byApiKey ? { by_api_key: 'true' } : {},
	});
}

export const imageRouterApi = {
	generateImage,
	editImage,
	listImageModels,
	downloadFile,
	createImage,
	createVideo,
	createChatCompletion,
	createResponse,
	listModels,
	getModel,
	getCredits,
};

type CreateImageParams = {
	auth: ImageRouterAuthValue;
	model: string;
	prompt?: string;
	images?: unknown[];
	masks?: unknown[];
	quality?: string;
	size?: string;
	outputFormat?: string;
};

type CreateVideoParams = {
	auth: ImageRouterAuthValue;
	model: string;
	prompt?: string;
	image?: string;
	size?: string;
	seconds?: number;
};
