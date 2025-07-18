import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { createAIProvider, MarkdownVariant } from '@activepieces/shared';
import { aiProps } from '@activepieces/pieces-common';
import { generateText, tool, LanguageModel, jsonSchema, CoreMessage, CoreUserMessage } from 'ai';
import mime from 'mime-types';
import Ajv from 'ajv';

export const extractStructuredData = createAction({
	name: 'extractStructuredData',
	displayName: 'Extract Structured Data',
	description: 'Extract structured data from provided text,image or PDF.',
	props: {
		provider: aiProps({ modelType: 'language', functionCalling: true }).provider,
		model: aiProps({ modelType: 'language', functionCalling: true }).model,
		text: Property.LongText({
			displayName: 'Text',
			description: 'Text to extract structured data from.',
			required: false,
		}),
		files: Property.Array({
			displayName: 'Files',
			required: false,
			properties: {
				file: Property.File({
					displayName: 'Image/PDF',
					description: 'Image or PDF to extract structured data from.',
					required: false,
				}),
			},
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
		schama: Property.DynamicProperties({
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
			displayName: 'Max Tokens',
			required: false,
			defaultValue: 2000,
		}),
	},
	async run(context) {
		const providerName = context.propsValue.provider as string;
		const modelInstance = context.propsValue.model as LanguageModel;
		const text = context.propsValue.text;
		const files = (context.propsValue.files as Array<{ file: ApFile }>) ?? [];
		const prompt = context.propsValue.prompt;
		const schema = context.propsValue.schama;
		const maxTokens = context.propsValue.maxTokens;

		if (!text && !files.length) {
			throw new Error('Please provide text or image/PDF to extract data from.');
		}

		const baseURL = `${context.server.apiUrl}v1/ai-providers/proxy/${providerName}`;
		const engineToken = context.server.token;
		const provider = createAIProvider({
			providerName,
			modelInstance,
			apiKey: engineToken,
			baseURL,
		});

		let schemaDefinition: any;
		
		if (context.propsValue.mode === 'advanced') {
			const ajv = new Ajv();
			const isValidSchema = ajv.validateSchema(schema['fields']);

			if (!isValidSchema) {
				throw new Error(
					JSON.stringify({
						message: 'Invalid JSON schema',
						errors: ajv.errors,
					}),
				);
			}

			schemaDefinition = jsonSchema(schema['fields'] as any);
		} else {
			const fields = schema['fields'] as Array<{
				name: string;
				description?: string;
				type: string;
				isRequired: boolean;
			}>;

			const properties: Record<string, any> = {};
			const required: string[] = [];
			
			fields.forEach((field) => {
				properties[field.name] = {
					type: field.type,
					description: field.description,
				};

				if (field.isRequired) {
					required.push(field.name);
				}
			});

			const jsonSchemaObject = {
				type: 'object' as const,
				properties,
				required,
			};

			schemaDefinition = jsonSchema(jsonSchemaObject);
		}

		const extractionTool = tool({
			description: 'Extract structured data from the provided content',
			parameters: schemaDefinition,
			execute: async (data) => {
				return data;
			},
		});

		const messages: Array<CoreMessage> = [];

		// Prepare content parts array
		const contentParts: CoreUserMessage['content']= [];

		// Add the main prompt message
		let textContent = prompt || 'Extract the following data from the provided data.';
		if (text) {
			textContent += `\n\nText to analyze:\n${text}`;
		}

		contentParts.push({
			type: 'text',
			text: textContent,
		});

		// Handle file processing similar to previous implementation
		if (files.length > 0) {
			for (const fileWrapper of files) {
				const file = fileWrapper.file;
				if (!file) {
					continue;
				}
				const fileType = file.extension ? mime.lookup(file.extension) : 'image/jpeg';

				if (fileType && fileType.startsWith('image') && file.base64) {
					contentParts.push({
						type: 'image',
						image: `data:${fileType};base64,${file.base64}`,
					});
				}
			}
		}

		// Add the message with all content parts
		messages.push({
			role: 'user',
			content: contentParts,
		});

		try {
			// Use Vercel AI SDK to generate text with tool calling
			const result = await generateText({
				model: provider,
				maxTokens,
				tools: {
					extractData: extractionTool,
				},
				toolChoice: 'required',
				messages,
				headers: {
					'Authorization': `Bearer ${engineToken}`,
				},
			});

			// Extract the tool call result
			const toolCalls = result.toolCalls;
			if (!toolCalls || toolCalls.length === 0) {
				throw new Error('No structured data could be extracted from the input.');
			}

			const extractedData = toolCalls[0].args;
			return extractedData;

		} catch (error) {
			throw new Error(`Failed to extract structured data: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	},
});


