import { claudeAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import Anthropic from '@anthropic-ai/sdk';
import { TextBlock, ToolUseBlock } from '@anthropic-ai/sdk/resources';
import Ajv from 'ajv';
import mime from 'mime-types';

export const extractStructuredDataAction = createAction({
	auth: claudeAuth,
	name: 'extract-structured-data',
	displayName: 'Extract Structured Data',
	description: 'Extract structured data from provided text,image or PDF.',
	props: {
		model: Property.StaticDropdown({
			displayName: 'Model',
			required: true,
			description:
				'The model which will generate the completion. Some models are suitable for natural language tasks, others specialize in code.',
			defaultValue: 'claude-3-haiku-20240307',
			options: {
				disabled: false,
				options: [
					{ value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
					{ value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
					{ value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
					{ value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
					{ value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku' },
					{ value: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet' },
				],
			},
		}),
		text: Property.LongText({
			displayName: 'Text',
			description: 'Text to extract structured data from.',
			required: false,
		}),
		image: Property.File({
			displayName: 'Image/PDF',
			description: 'Image or PDF to extract structured data from.',
			required: false,
		}),
		prompt: Property.LongText({
			displayName: 'Guide Prompt',
			description: 'Prompt to guide the AI.',
			defaultValue: 'Extract the following data from the provided data.',
			required: false,
		}),
		mode: Property.StaticDropdown<'simple' | 'advanced'>({
			displayName: 'Data Schema Type',
			description: 'For complex schema, you can use advanced mode.',
			required: true,
			defaultValue: 'simple',
			options: {
				disabled: false,
				options: [
					{ label: 'Simple', value: 'simple' },
					{ label: 'Advanced', value: 'advanced' },
				],
			},
		}),
		schema: Property.DynamicProperties({
			displayName: 'Data Definition',
			required: true,
			refreshers: ['mode'],
			props: async (propsValue) => {
				const mode = propsValue['mode'] as unknown as 'simple' | 'advanced';
				if (mode === 'advanced') {
					return {
						fields: Property.Json({
							displayName: 'JSON Schema',
							description:
								'Learn more about JSON Schema here: https://json-schema.org/learn/getting-started-step-by-step',
							required: true,
							defaultValue: {
								type: 'object',
								properties: {
									name: {
										type: 'string',
									},
									age: {
										type: 'number',
									},
								},
								required: ['name'],
							},
						}),
					};
				}
				return {
					fields: Property.Array({
						displayName: 'Data Definition',
						required: true,
						properties: {
							name: Property.ShortText({
								displayName: 'Name',
								description:
									'Provide the name of the value you want to extract from the unstructured text. The name should be unique and short. ',
								required: true,
							}),
							description: Property.LongText({
								displayName: 'Description',
								description:
									'Brief description of the data, this hints for the AI on what to look for',
								required: false,
							}),
							type: Property.StaticDropdown({
								displayName: 'Data Type',
								description: 'Type of parameter.',
								required: true,
								defaultValue: 'string',
								options: {
									disabled: false,
									options: [
										{ label: 'Text', value: 'string' },
										{ label: 'Number', value: 'number' },
										{ label: 'Boolean', value: 'boolean' },
									],
								},
							}),
							isRequired: Property.Checkbox({
								displayName: 'Fail if Not present?',
								required: true,
								defaultValue: false,
							}),
						},
					}),
				};
			},
		}),
		maxTokens: Property.Number({
			displayName: 'Maximum Tokens',
			required: false,
			description:
				"The maximum number of tokens to generate. Requests can use up to 2,048 or 4,096 tokens shared between prompt and completion, don't set the value to maximum and leave some tokens for the input. The exact limit varies by model. (One token is roughly 4 characters for normal English text)",
		}),
	},
	async run(context) {
		const { model, text, image, schema, prompt, maxTokens } = context.propsValue;

		if (!text && !image) {
			throw new Error('Please provide text or image/PDF to extract data from.');
		}


		let params: AIFunctionArgumentDefinition;
		if (context.propsValue.mode === 'advanced') {
			const ajv = new Ajv();
			const isValidSchema = ajv.validateSchema(schema);

			if (!isValidSchema) {
				throw new Error(
					JSON.stringify({
						message: 'Invalid JSON schema',
						errors: ajv.errors,
					}),
				);
			}

			params = schema['fields'] as AIFunctionArgumentDefinition;
		} else {
			params = {
				type: 'object',
				properties: (
					schema['fields'] as Array<{
						name: string;
						description?: string;
						type: string;
						isRequired: boolean;
					}>
				).reduce((acc, field) => {
					acc[field.name] = {
						type: field.type,
						description: field.description,
					};
					return acc;
				}, {} as Record<string, { type: string; description?: string }>),
				required: (
					schema['fields'] as Array<{
						name: string;
						description?: string;
						type: string;
						isRequired: boolean;
					}>
				)
					.filter((field) => field.isRequired)
					.map((field) => field.name),
			};
		}

		const anthropic = new Anthropic({
			apiKey: context.auth,
		});

		const messages: Anthropic.Messages.MessageParam[] = [
			{
				role: 'user',
				content: prompt ?? 'Use optical character recognition (OCR) to extract from provided data.',
			},
		];

		if (!isNil(text) && text !== '') {
			messages.push({
				role: 'user',
				content: text,
			});
		}

		if (image) {
			const mediaType = image.extension ? mime.lookup(image.extension) : 'image/jpeg';
			if (mediaType === 'application/pdf') {
				messages.push({
					role: 'user',
					content: [
						{
							type: 'document',
							source: {
								type: 'base64',
								media_type: 'application/pdf',
								data: image.base64,
							},
						},
					],
				});
			} else {
				messages.push({
					role: 'user',
					content: [
						{
							type: 'image',
							source: {
								type: 'base64',
								media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
								data: image.base64,
							},
						},
					],
				});
			}
		}
		const response = await anthropic.messages.create({
			model: model,
			messages,
			tools: [
				{
					name: 'extract_structured_data',
					description: 'Extract the following data from the provided data.',
					input_schema: params,
				},
			],
			tool_choice: { type: 'tool', name: 'extract_structured_data' },
			max_tokens: maxTokens ?? 2000,
		});
		
		const toolCallsResponse = response.content.filter(
			(choice): choice is ToolUseBlock => choice.type === 'tool_use',
		);

		const toolCall = toolCallsResponse[0];

		const choices = response.content
			.filter((choice): choice is TextBlock => choice.type === 'text')
			.map((choice: TextBlock) => ({
				content: choice.text,
				role: 'assistant',
			}));

		const args = toolCall.input;
		if (isNil(args)) {
			throw new Error(
				JSON.stringify({
					message: choices[0].content ?? 'Failed to extract structured data from the input.',
				}),
			);
		}
		return args;
	},
});

type AIFunctionArgumentDefinition = {
	type: 'object';
	properties?: unknown | null;
	required?: string[];
	[k: string]: unknown;
};
