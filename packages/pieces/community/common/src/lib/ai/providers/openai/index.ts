import { AI, AIChatRole, AIFactory } from '../..';
import { isNil } from '@activepieces/shared';
import OpenAI from 'openai';
import { imageMapper, model, ModelType } from '../utils';
import { Property } from '@activepieces/pieces-framework';
import {
	ChatCompletionMessageParam,
	FunctionParameters,
	ModerationMultiModalInput,
	ChatCompletionContentPartImage,
	ChatCompletionContentPart,
} from 'openai/resources';
import mime from 'mime-types';

export const openai: AIFactory = ({ proxyUrl, engineToken }): AI => {
	const openaiApiVersion = 'v1';
	const sdk = new OpenAI({
		apiKey: engineToken,
		baseURL: `${proxyUrl}/${openaiApiVersion}`,
	});
	return {
		provider: 'OPENAI',
		function: {
			call: async (params) => {
				const messages: ChatCompletionMessageParam[] = params.messages.map((message) => ({
					role: AIChatRole.USER,
					content: [{ type: 'text', text: message.content }],
				}));

				if (params.files.length) {
					const contents: Array<ChatCompletionContentPartImage> = [];
					for (const file of params.files) {
						const fileType = file.extension ? mime.lookup(file.extension) : 'image/jpeg';

						if (fileType && fileType.startsWith('image')) {
							contents.push({
								type: 'image_url',
								image_url: {
									url: `data:image/${file.extension};base64,${file.base64}`,
								},
							});
						}
					}
					if (contents.length) {
						const lastMessage = messages[messages.length - 1];

						if (lastMessage && lastMessage.role === AIChatRole.USER) {
							const exitingContent = lastMessage.content as Array<ChatCompletionContentPart>;
							lastMessage.content = [...exitingContent, ...contents];
						} else {
							messages.push({
								role: AIChatRole.USER,
								content: contents,
							});
						}
					}
				}

				const completion = await sdk.chat.completions.create({
					model: params.model,
					messages: messages,
					max_completion_tokens: params.maxTokens,
					tools: params.functions.map((functionDefinition) => ({
						type: 'function',
						function: {
							name: functionDefinition.name,
							description: functionDefinition.description,
							parameters: functionDefinition.arguments as unknown as FunctionParameters,
						},
					})),
				});

				const toolCall = completion.choices[0].message.tool_calls?.[0];

				return {
					choices: completion.choices.map((choice) => ({
						role: AIChatRole.ASSISTANT,
						content: choice.message.content ?? '',
					})),
					call: toolCall
						? {
								id: toolCall.id,
								function: {
									name: toolCall.function.name,
									arguments: JSON.parse(toolCall.function.arguments as string),
								},
						  }
						: null,
					created: completion.created,
					model: completion.model,
					usage: completion.usage && {
						completionTokens: completion.usage.completion_tokens,
						promptTokens: completion.usage.prompt_tokens,
						totalTokens: completion.usage.total_tokens,
					},
				};
			},
		},
		image: {
			generate: async (params) => {
				const mapper = findImageMapper(params.model);
				const input = await mapper.encodeInput(params);
				const response = await sdk.images.generate(input as any);
				return mapper.decodeOutput(response);
			},
		},
		chat: {
			text: async (params) => {
				const completion = await sdk.chat.completions.create({
					model: params.model,
					messages: params.messages.map((message) => ({
						role: message.role === 'user' ? 'user' : 'assistant',
						content: message.content,
					})),
					temperature: Math.tanh(params.creativity ?? 100),
					max_completion_tokens:params.maxTokens,
					stop: params.stop,
				});

				return {
					choices: completion.choices.map((choice) => ({
						role: AIChatRole.ASSISTANT,
						content: choice.message.content ?? '',
					})),
					created: completion.created,
					model: completion.model,
					usage: completion.usage && {
						completionTokens: completion.usage.completion_tokens,
						promptTokens: completion.usage.prompt_tokens,
						totalTokens: completion.usage.total_tokens,
					},
				};
			},
		},
		moderation: {
			create: async (params) => {
				const inputs: ModerationMultiModalInput[] = [];

				if (params.text) {
					inputs.push({ type: 'text', text: params.text });
				}
				for (const image of params.images ?? []) {
					inputs.push({
						type: 'image_url',
						image_url: {
							url: `data:image/${image.extension};base64,${image.base64}`,
						},
					});
				}

				const response = await sdk.moderations.create({
					input: inputs,
					model: params.model,
				});

				return response.results[0];
			},
		},
	};
};

const findImageMapper = (model: string) => {
	const mapper = openaiModels.find((m) => m.value === model)?.mapper;
	if (isNil(mapper) || !('__tag' in mapper) || mapper.__tag !== ModelType.IMAGE) {
		throw new Error(`OpenAI image model ${model} not found`);
	}
	return mapper;
};

const openaiImageMapper = imageMapper({
	encodeInput: async (params) => {
		return {
			model: params.model,
			prompt: params.prompt,
			quality: params.advancedOptions?.['quality'] as any,
			size: params.size as any,
			response_format: 'b64_json',
		};
	},
	decodeOutput: async (result) => {
		const response = result as OpenAI.Images.ImagesResponse;
		const imageBase64 = response.data[0].b64_json;
		return imageBase64 ? { image: imageBase64 } : null;
	},
	advancedOptions: {
		quality: Property.StaticDropdown({
			options: {
				options: [
					{ label: 'Standard', value: 'standard' },
					{ label: 'HD', value: 'hd' },
				],
				disabled: false,
				placeholder: 'Select Image Quality',
			},
			defaultValue: 'standard',
			description:
				'Standard images are less detailed and faster to generate, while HD images are more detailed but slower to generate.',
			displayName: 'Image Quality',
			required: true,
		}),
	},
});

export const openaiModels = [
	model({ label: 'gpt-4o', value: 'gpt-4o', supported: ['text', 'function'] }),
	model({
		label: 'gpt-4o-mini',
		value: 'gpt-4o-mini',
		supported: ['text', 'function'],
	}),
	model({
		label: 'gpt-4-turbo',
		value: 'gpt-4-turbo',
		supported: ['text', 'function'],
	}),
	model({
		label: 'gpt-3.5-turbo',
		value: 'gpt-3.5-turbo',
		supported: ['text'],
	}),
	model({ label: 'dall-e-3', value: 'dall-e-3', supported: ['image'] }).mapper(openaiImageMapper),
	model({ label: 'dall-e-2', value: 'dall-e-2', supported: ['image'] }).mapper(openaiImageMapper),
	model({
		label: 'omni-moderation-latest',
		value: 'omni-moderation-latest',
		supported: ['moderation'],
	}),
	model({label:'gpt-4.1',value:'gpt-4.1',supported:['text','function']}),
	model({label:'gpt-4.1-mini',value:'gpt-4.1-mini',supported:['text','function']}),
	model({label:'gpt-4.1-nano',value:'gpt-4.1-nano',supported:['text','function']}),
	model({label:'o3',value:'o3',supported:['text','function']}),
	model({label:'o3-mini',value:'o3-mini',supported:['text','function']}),
	model({label:'o4-mini',value:'o4-mini',supported:['text','function']})
];
