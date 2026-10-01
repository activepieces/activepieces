import { AiStepAction, ApFile, createAction, PieceAuth, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import Ajv from 'ajv';
import mime from 'mime-types';
import { runOnWorker, uploadAiFiles } from '../../common/ai-step';
import { aiProps, aiProviderSelection } from '../../common/props';

export const extractStructuredData = createAction({
  audience: 'both',
	name: 'extractStructuredData',
	classification: 'READ',
	displayName: 'Extract Structured Data',
	description: 'Pull names, amounts and other fields from text, images or PDFs.',
	aiMetadata: { description: 'Pulls typed fields out of unstructured input (text, images or PDFs) against a schema supplied either in simple mode, a list of field definitions, or advanced mode, a raw JSON Schema. Pick it when you need specific named values from documents such as invoices, receipts or emails; use classifyText for a single label, summarizeText for prose condensation, or askAi for open-ended analysis. At least one of Text or Files is required or the step throws; read-only and idempotent.', idempotent: true },
	props: {
		provider: aiProps({ modelType: 'text' }).provider,
		model: aiProps({ modelType: 'text' }).model,
		text: Property.LongText({
			displayName: 'Text',
			description: 'Text to extract from. Fill this, Files, or both.',
			required: false,
		}),
		files: Property.Array({
			displayName: 'Files',
			description: 'Images or PDFs to extract from.',
			required: false,
			properties: {
				file: Property.File({
					displayName: 'Image/PDF',
					required: false,
				}),
			},
		}),
		prompt: Property.LongText({
			displayName: 'Prompt',
			description: 'Extra guidance for the AI, like a date format to use.',
			defaultValue: 'Extract the following data from the provided data.',
			required: false,
		}),
		mode: Property.StaticDropdown<'simple' | 'advanced'>({
			displayName: 'Data Schema Type',
			required: true,
			defaultValue: 'simple',
			display: 'cards',
			options: {
				disabled: false,
				options: [
					{ label: 'Simple', value: 'simple', description: 'List fields', icon: 'sliders' },
					{ label: 'Advanced', value: 'advanced', description: 'JSON Schema', icon: 'code' },
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
							description: 'JSON Schema for the output. See json-schema.org to learn more.',
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
						displayName: 'Fields',
						required: true,
						properties: {
							name: Property.ShortText({
								displayName: 'Name',
								description: 'Short, unique name for this value in the output.',
								placeholder: 'e.g. invoice_total',
								required: true,
							}),
							description: Property.LongText({
								displayName: 'Description',
								description: 'Tells the AI what to look for.',
								placeholder: 'e.g. Total due, including tax',
								required: false,
							}),
							type: Property.StaticDropdown({
								displayName: 'Data Type',
								description: 'Data type of the extracted value.',
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
								displayName: 'Required',
								description: 'Tells the AI this field must always have a value.',
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
			description: 'Longest reply allowed, in tokens. Raise it if a long reply fails or stops short.',
			required: false,
			defaultValue: 2000,
			advanced: true,
		}),
	},
	async run(context) {
		const { provider, configId } = aiProviderSelection.resolveOrThrow(context.propsValue.provider);
		const attachments = ((context.propsValue.files as { file?: ApFile }[] | undefined) ?? []).map((row) => row?.file);

		if (!context.propsValue.text && attachments.length === 0) {
			throw new Error('Please provide text or image/PDF to extract data from.');
		}

		if (context.propsValue.mode === 'advanced') {
			assertValidJsonSchema(context.propsValue.schema['fields']);
		}

		const result = await runOnWorker({
			context,
			buildRequest: async () => ({
				action: AiStepAction.EXTRACT_STRUCTURED_DATA,
				provider,
				...spreadIfDefined('providerConfigId', configId),
				modelId: context.propsValue.model,
				...spreadIfDefined('text', context.propsValue.text),
				...spreadIfDefined('prompt', context.propsValue.prompt),
				files: await uploadAiFiles({ context, files: attachments, mimeTypeOf: documentMimeType }),
				schema: { mode: context.propsValue.mode ?? 'simple', fields: context.propsValue.schema['fields'] },
				...spreadIfDefined('maxOutputTokens', context.propsValue.maxOutputTokens),
			}),
		});

		if (result.status === 'paused') {
			return {};
		}

		return result.output.answer;
	},
});

function assertValidJsonSchema(fields: unknown): void {
	const ajv = new Ajv();
	if (!ajv.validateSchema(fields as Parameters<Ajv['validateSchema']>[0])) {
		throw new Error(
			JSON.stringify({
				message: 'Invalid JSON schema',
				errors: ajv.errors,
			}),
		);
	}
}

function documentMimeType(file: ApFile): string | undefined {
	if (!file.extension) {
		return 'image/jpeg';
	}
	const detected = mime.lookup(file.extension);
	return detected === false ? undefined : detected;
}
