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

export const imageRouterApi = { generateImage, editImage, listImageModels, downloadFile };
