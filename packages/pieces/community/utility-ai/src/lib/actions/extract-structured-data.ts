import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { AIUsageFeature, createAIModel } from '@activepieces/common-ai';
import { generateText, tool, jsonSchema, ModelMessage, UserModelMessage } from 'ai';
import { LanguageModelV2 } from '@ai-sdk/provider';
import mime from 'mime-types';
import Ajv from 'ajv';
import { aiProps } from '@activepieces/common-ai';

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
		maxOutputTokens: Property.Number({
			displayName: 'Max Tokens',
			required: false,
			defaultValue: 2000,
		}),
	},
	async run(context) {
		const providerName = context.propsValue.provider as string;
		const modelInstance = context.propsValue.model as LanguageModelV2;
		const text = context.propsValue.text;
		const files = (context.propsValue.files as Array<{ file: ApFile }>) ?? [];
		const prompt = context.propsValue.prompt;
		const schema = context.propsValue.schama;
		const maxOutputTokens = context.propsValue.maxOutputTokens;

		if (!text && !files.length) {
			throw new Error('Please provide text or image/PDF to extract data from.');
		}

		const baseURL = `${context.server.apiUrl}v1/ai-providers/proxy/${providerName}`;
		const engineToken = context.server.token;
		const model = createAIModel({
			providerName,
			modelInstance,
			engineToken,
			baseURL,
			metadata: {
				feature: AIUsageFeature.UTILITY_AI,
			},
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
				if (!/^[a-zA-Z0-9_.-]+$/.test(field.name)) {
					throw new Error(`Invalid field name: ${field.name}. Field names can only contain letters, numbers, underscores, dots and hyphens.`);
				}

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
			inputSchema: schemaDefinition,
			execute: async (data) => {
				return data;
			},
		});

		const messages: Array<ModelMessage> = [];

		const contentParts: UserModelMessage['content']= [];

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

				if (fileType && fileType.startsWith('image')  && file.base64) {
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
				headers: {
					'Authorization': `Bearer ${engineToken}`,
				},
			});

			const toolCalls = result.toolCalls;
			if (!toolCalls || toolCalls.length === 0) {
				throw new Error('No structured data could be extracted from the input.');
			}

			const extractedData = toolCalls[0].input;
			return extractedData;

		} catch (error) {
			throw new Error(`Failed to extract structured data: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	},
});


