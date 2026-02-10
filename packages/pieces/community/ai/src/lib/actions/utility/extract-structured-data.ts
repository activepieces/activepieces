import { ApFile, createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createAIModel } from '../../common/ai-sdk';
import { generateText, tool, jsonSchema, ModelMessage, UserModelMessage } from 'ai';
import mime from 'mime-types';
import Ajv from 'ajv';
import { aiProps } from '../../common/props';
import { AIProviderName } from '@activepieces/shared';

export const extractStructuredData = createAction({
	name: 'extractStructuredData',
	displayName: 'Extract Structured Data',
	description: 'Accurately Pull names, amounts, and other structured data from emails, invoices, and scanned documents.',
	props: {
		provider: aiProps({ modelType: 'text' }).provider,
		model: aiProps({ modelType: 'text' }).model,
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
		schema: Property.DynamicProperties({
			auth: PieceAuth.None(),
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
		maxOutputTokens: Property.Number({
			displayName: 'Max Tokens',
			required: false,
			defaultValue: 2000,
		}),
	},
	async run(context) {
		const provider = context.propsValue.provider;
		const modelId = context.propsValue.model;
		const text = context.propsValue.text;
		const files = (context.propsValue.files as Array<{ file: ApFile }>) ?? [];
		const prompt = context.propsValue.prompt;
		const schema = context.propsValue.schema;
		const maxOutputTokens = context.propsValue.maxOutputTokens;

		if (!text && !files.length) {
			throw new Error('Please provide text or image/PDF to extract data from.');
		}

		const model = await createAIModel({
			provider: provider as AIProviderName,
			modelId,
			engineToken: context.server.token,
			apiUrl: context.server.apiUrl,
			projectId: context.project.id,
			flowId: context.flows.current.id,
			runId: context.run.id,
		});

		let schemaDefinition: any;
		// Track sanitized-to-original name mapping to restore output keys.
		const sanitizedNameMap: Record<string, string> = {};

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
				const sanitizedFieldName = field.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
				sanitizedNameMap[sanitizedFieldName] = field.name;

				properties[sanitizedFieldName] = {
					type: field.type,
					description: field.description,
				};

				if (field.isRequired) {
					required.push(sanitizedFieldName);
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
			inputSchema: schemaDefinition,
			execute: async (data) => {
				return data;
			},
		});

		const messages: Array<ModelMessage> = [];

		const contentParts: UserModelMessage['content'] = [];

		let textContent = prompt || 'Extract the following data from the provided data.';
		if (text) {
			textContent += `\n\nText to analyze:\n${text}`;
		}

		contentParts.push({
			type: 'text',
			text: textContent,
		});

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
				} else if (fileType && fileType.startsWith('application/pdf') && file.base64) {
					contentParts.push({
						type: 'file',
						data: `data:${fileType};base64,${file.base64}`,
						mediaType: fileType,
						filename: file.filename,
					});
				}
			}
		}

		messages.push({
			role: 'user',
			content: contentParts,
		});

		try {
			const result = await generateText({
				model,
				maxOutputTokens,
				tools: {
					extractData: extractionTool,
				},
				toolChoice: 'required',
				messages,
			});

			const toolCalls = result.toolCalls;
			if (!toolCalls || toolCalls.length === 0) {
				throw new Error('No structured data could be extracted from the input.');
			}

			const extractedData = toolCalls[0].input;

			if (Object.keys(sanitizedNameMap).length > 0 && extractedData && typeof extractedData === 'object') {
				const restoredData: Record<string, unknown> = {};
				for (const [key, value] of Object.entries(extractedData)) {
					const originalName = sanitizedNameMap[key] ?? key;
					restoredData[originalName] = value;
				}
				return restoredData;
			}

			return extractedData;

		} catch (error) {
			throw new Error(`Failed to extract structured data: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	},
});


