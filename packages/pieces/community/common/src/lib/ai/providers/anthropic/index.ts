import Anthropic from '@anthropic-ai/sdk';
import { TextBlock, Tool, ToolUseBlock } from '@anthropic-ai/sdk/resources';
import { AI, AIChatRole, AIFactory } from '../..';
import mime from 'mime-types';

export const anthropic: AIFactory = ({ proxyUrl, engineToken }): AI => {
	const sdk = new Anthropic({
		apiKey: engineToken,
		baseURL: proxyUrl,
		defaultHeaders: {
			Authorization: `Bearer ${engineToken}`,
		},
	});
	return {
		provider: 'ANTHROPIC' as const,
		function: {
			call: async (params) => {
				const messages: Anthropic.Messages.MessageParam[] = params.messages.map((message) => ({
					role: AIChatRole.USER,
					content: [{ type: 'text', text: message.content }],
				}));

				if (params.files.length) {
					const contents: Array<Anthropic.Messages.ContentBlockParam> = [];

					params.files.forEach((file, index) => {
						const fileType = file.extension ? mime.lookup(file.extension) : 'image/jpeg';
						if (fileType && fileType.startsWith('image')) {
							contents.push(
								{
									type: 'text',
									text: `Image ${index + 1}:`,
								},
								{
									type: 'image',
									source: {
										type: 'base64',
										media_type: fileType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
										data: file.base64,
									},
								},
							);
						}
						if (fileType === 'application/pdf') {
							contents.push({
								type: 'document',
								source: {
									type: 'base64',
									media_type: 'application/pdf',
									data: file.base64,
								},
							});
						}
					});

					if (contents.length) {
						const lastMessage = messages[messages.length - 1];

						if (lastMessage && lastMessage.role === AIChatRole.USER) {
							const exitingContent =
								lastMessage.content as Array<Anthropic.Messages.ContentBlockParam>;
							lastMessage.content = [...exitingContent, ...contents];
						} else {
							messages.push({
								role: AIChatRole.USER,
								content: contents,
							});
						}
					}
				}

				const completion = await sdk.messages.create({
					model: params.model,
					messages: messages,
					max_tokens: params.maxTokens ?? 2000,
					tools: params.functions.map((functionDefinition) => ({
						name: functionDefinition.name,
						description: functionDefinition.description,
						input_schema: functionDefinition.arguments as unknown as Tool.InputSchema,
					})),
					tool_choice: { type: 'tool', name: params.functions[0].name },
				});

				const toolCallsResponse = completion.content.filter(
					(choice): choice is ToolUseBlock => choice.type === 'tool_use',
				);

				const toolCall = toolCallsResponse[0];
				return {
					choices: completion.content
						.filter((choice): choice is TextBlock => choice.type === 'text')
						.map((choice: TextBlock) => ({
							content: choice.text,
							role: AIChatRole.ASSISTANT,
						})),
					call: toolCall
						? {
								id: toolCall.id,
								function: {
									name: toolCall.name,
									arguments: toolCall.input,
								},
						  }
						: null,
					model: completion.model,
					created: new Date().getTime(),
					usage: {
						completionTokens: completion.usage.output_tokens,
						promptTokens: completion.usage.input_tokens,
						totalTokens: completion.usage.output_tokens + completion.usage.input_tokens,
					},
				};
			},
		},
		chat: {
			text: async (params) => {
				const concatenatedSystemMessage = params.messages
					.filter((message) => message.role === 'system')
					.map((message) => message.content)
					.join('\n');
				const completion = await sdk.messages.create({
					model: params.model,
					messages: params.messages.map((message) => ({
						role: message.role === 'user' ? 'user' : 'assistant',
						content: message.content,
					})),
					temperature: Math.tanh(params.creativity ?? 100),
					stop_sequences: params.stop,
					system: concatenatedSystemMessage,
					stream: false,
					max_tokens: params.maxTokens ?? 2000,
				});

				return {
					choices: completion.content
						.filter((choice): choice is TextBlock => choice.type === 'text')
						.map((choice: TextBlock) => ({
							content: choice.text,
							role: AIChatRole.ASSISTANT,
						})),
					created: new Date().getTime(),
					model: completion.model,
					usage: {
						completionTokens: completion.usage.output_tokens,
						promptTokens: completion.usage.input_tokens,
						totalTokens: completion.usage.output_tokens + completion.usage.input_tokens,
					},
				};
			},
		},
		image: {
			generate: async (parmas) => null,
		},
	};
};
