import { isNil } from '@activepieces/shared';
import { AI, AIChatRole, AIFactory } from '../..';
import { GenerateImagesParameters, GenerateImagesResponse, GoogleGenAI } from '@google/genai';
import { imageMapper, model, ModelType } from '../utils';
import { Property } from '@activepieces/pieces-framework';

export const gemini: AIFactory = ({ proxyUrl, engineToken }): AI => {
	const geminiApiVersion = 'v1';
	const sdk = new GoogleGenAI({
		apiKey: engineToken,
		httpOptions: {
			baseUrl: `${proxyUrl}/${geminiApiVersion}`,
		},
	});

	return {
		provider: 'gemini',
		chat: {
			text: async (params) => {
				const userMessage = params.messages.find((message) => message.role === 'user');

				if (isNil(userMessage) || isNil(userMessage.content)) {
					throw new Error('Provide prompt value.');
				}

				const completion = await sdk.models.generateContent({
					model: params.model,
					contents: userMessage?.content,
					config: {
						maxOutputTokens: params.maxTokens,
						temperature: Math.tanh(params.creativity ?? 100),
					},
				});

				return {
					choices: [
						{
							role: AIChatRole.ASSISTANT,
							content: completion.text ?? '',
						},
					],
					created: completion.createTime,
					model: params.model,
					usage: completion.usageMetadata && {
						completionTokens: completion.usageMetadata.candidatesTokenCount!,
						promptTokens: completion.usageMetadata.promptTokenCount!,
						totalTokens: completion.usageMetadata.totalTokenCount!,
					},
				};
			},
		},
		image: {
			generate: async (params) => {
				const mapper = findImageMapper(params.model);
				const input = (await mapper.encodeInput(params)) as GenerateImagesParameters;
				const response = await sdk.models.generateImages(input);
				return mapper.decodeOutput(response);
			},
		},
	};
};

const findImageMapper = (model: string) => {
	const mapper = geminiModels.find((m) => m.value === model)?.mapper;
	if (isNil(mapper) || !('__tag' in mapper) || mapper.__tag !== ModelType.IMAGE) {
		throw new Error(`Gemini image model ${model} not found`);
	}
	return mapper;
};

const geminiImageMapper = imageMapper({
	encodeInput: async (params) => {
		return {
			model: params.model,
			prompt: params.prompt,
			config: {
				aspectRatio: params.advancedOptions?.['aspectRatio'] as any,
			},
		};
	},
	decodeOutput: async (result) => {
		const response = result as GenerateImagesResponse;
		const imageBase64 = response?.generatedImages?.[0]?.image?.imageBytes;
		return imageBase64 ? { image: imageBase64 } : null;
	},
	advancedOptions: {
		aspectRation: Property.StaticDropdown({
			displayName: 'Aspect Ratio',
			defaultValue: '1:1',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: '1:1', value: '1:1' },
					{ label: '3:4', value: '3:4' },
					{ label: '4:4', value: '4:3' },
					{ label: '9:16', value: '9:16' },
					{ label: '16:9', value: '16:9' },
				],
			},
		}),
	},
});

export const geminiModels = [
	model({ label: 'gemini-2.0-flash', value: 'gemini-2.0-flash', supported: ['text'] }),
	model({
		label: 'gemini-2.0-flash-lite',
		value: 'gemini-2.0-flash-lite',
		supported: ['text'],
	}),
	model({ label: 'gemini-1.5-flash', value: 'gemini-1.5-flash', supported: ['text'] }),
	model({ label: 'gemini-1.5-flash-8b', value: 'gemini-1.5-flash-8b', supported: ['text'] }),
	model({ label: 'gemini-1.5-pro', value: 'gemini-1.5-pro', supported: ['text'] }),
	model({ label: 'Imagen 3', value: 'imagen-3.0-generate-002', supported: ['image'] }).mapper(
		geminiImageMapper,
	),
];
