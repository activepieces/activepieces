import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { spreadIfDefined } from '@activepieces/shared';
import {
	SUPPORTED_AI_PROVIDERS,
	aiProps,
	AI_USAGE_FEATURE_HEADER,
	AIUsageFeature,
} from '@activepieces/common-ai';
import { GoogleGenAI } from '@google/genai';
import mime from 'mime-types';
import OpenAI from 'openai';
import { VideoModel } from 'openai/resources/videos';

type GenerateVideoParams = {
	apiKey: string;
	baseUrl: string;
	image: ApFile | undefined;
	prompt: string;
	advancedOptions: any;
	modelInstance: { modelId: string };
};
const generateVideoForGoogle = async ({
	apiKey,
	baseUrl,
	image,
	prompt,
	advancedOptions,
	modelInstance,
}: GenerateVideoParams) => {
	const ai = new GoogleGenAI({
		apiKey: apiKey,
		httpOptions: {
			baseUrl,
			headers: {
				Authorization: `Bearer ${apiKey}`,
				[AI_USAGE_FEATURE_HEADER]: AIUsageFeature.VIDEO_AI,
			},
		},
	});

	let imageBytes: string | undefined;
	const fileType = image?.extension ? mime.lookup(image.extension) : 'image/jpeg';
	if (image && fileType && fileType.startsWith('image')) {
		imageBytes = image.base64;
	}

	const imageConfig = imageBytes
		? {
				imageBytes,
				mimeType: fileType || undefined,
		  }
		: undefined;

	let operation = await ai.models.generateVideos({
		...spreadIfDefined('image', imageConfig),
		model: modelInstance.modelId,
		prompt,
		config: {
			numberOfVideos: 1,
			...advancedOptions,
		},
	});

	while (!operation.done) {
		await new Promise((resolve) => setTimeout(resolve, 5000));
		operation = await ai.operations.getVideosOperation({
			operation,
		});
	}

	const videoFileId = operation.response?.generatedVideos?.[0]?.video?.uri?.split('/').pop();
	if (!videoFileId) {
		throw new Error('No video file IDs found');
	}
	// google api requires authentication to get the file so we hit the proxy url
	const proxyUrl = `${baseUrl}/download/v1beta/files/${videoFileId}`;
	return proxyUrl;
};

const generateVideoForOpenAI = async ({
	apiKey,
	baseUrl,
	image,
	prompt,
	advancedOptions,
	modelInstance,
}: GenerateVideoParams) => {
	const ai = new OpenAI({
		apiKey,
		baseURL: baseUrl +'/v1',
		defaultHeaders: {
			[AI_USAGE_FEATURE_HEADER]: AIUsageFeature.VIDEO_AI,
		},
	});

	// console.log(JSON.stringify(ai))

	let operation = await ai.videos.create({
		model: modelInstance.modelId as VideoModel,
		prompt,
		// input_reference: image?.data,
		...advancedOptions,
	});

	console.log(JSON.stringify(operation))


	while (operation.status === 'in_progress' || operation.status === 'queued') {
		await new Promise((resolve) => setTimeout(resolve, 5000));
		operation = await ai.videos.retrieve(operation.id);
		console.log(JSON.stringify(operation))
	}

	console.log('completed')
	const content = await ai.videos.downloadContent(operation.id);

	console.log(JSON.stringify(content))

	const body = content.arrayBuffer();
	const buffer = Buffer.from(await body);
	return buffer;
};

export const generateVideo = createAction({
	name: 'generate-video',
	displayName: 'Generate Video',
	description: '',
	props: {
		provider: aiProps({ modelType: 'video' }).provider,
		model: aiProps({ modelType: 'video' }).model,
		prompt: Property.LongText({
			displayName: 'Prompt',
			required: true,
		}),
		image: Property.File({
			displayName: 'First Frame Image',
			required: false,
			description: 'The first frame that the video will start with.',
		}),
		advancedOptions: aiProps({ modelType: 'video' }).advancedOptions,
	},
	async run(context) {
		const { provider, model, prompt, image, advancedOptions } = context.propsValue;
		const providerName = provider as string;
		const modelInstance = model as { modelId: string };

		const providerConfig = SUPPORTED_AI_PROVIDERS.find((p) => p.provider === providerName);
		if (!providerConfig) {
			throw new Error(`Provider ${providerName} not found`);
		}

		const baseUrl = `${context.server.apiUrl}v1/ai-providers/proxy/${providerName}`;
		if (providerName === 'google') {
			const videoFileUrl = await generateVideoForGoogle({
				apiKey: context.server.token,
				baseUrl,
				image,
				prompt,
				advancedOptions,
				modelInstance,
			});

			const response = await httpClient.sendRequest({
				method: HttpMethod.GET,
				url: videoFileUrl,
				responseType: 'arraybuffer',
				headers: {
					Authorization: `Bearer ${context.server.token}`,
				},
			});

			return context.files.write({
				data: Buffer.from(response.body),
				fileName: 'video.mp4',
			});
		} else if (providerName === 'openai') {
			const videoData = await generateVideoForOpenAI({
				apiKey: context.server.token,
				baseUrl,
				image,
				prompt,
				advancedOptions,
				modelInstance,
			});
			return context.files.write({
				data: Buffer.from(videoData),
				fileName: 'video.mp4',
			});
		} else {
			throw new Error(`Provider ${providerName} not supported`);
		}
	},
});
