import { ApFile, createAction, PieceAuth, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import Ajv from 'ajv';
import mime from 'mime-types';
import { runOnWorker, uploadAiFiles } from '../../common/ai-step';
import { aiProps, aiProviderSelection } from '../../common/props';

export const extractStructuredData = createAction({
  audience: 'both',
	name: 'extractStructuredData',
	classification: 'READ',
	displayName: 'Extract Structured Data',
	description: 'Accurately Pull names, amounts, and other structured data from emails, invoices, and scanned documents.',
	aiMetadata: { description: 'Pulls typed fields out of unstructured input (text, images or PDFs) against a schema supplied either in simple mode, a list of field definitions, or advanced mode, a raw JSON Schema. Pick it when you need specific named values from documents such as invoices, receipts or emails; use classifyText for a single label, summarizeText for prose condensation, or askAi for open-ended analysis. At least one of Text or Files is required or the step throws; read-only and idempotent.', idempotent: true },
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
			request: {
				action: 'EXTRACT_STRUCTURED_DATA',
				provider,
				...spreadIfDefined('providerConfigId', configId),
				modelId: context.propsValue.model,
				...spreadIfDefined('text', context.propsValue.text),
				...spreadIfDefined('prompt', context.propsValue.prompt),
				files: await uploadAiFiles({ context, files: attachments, mimeTypeOf: documentMimeType }),
				schema: { mode: context.propsValue.mode ?? 'simple', fields: context.propsValue.schema['fields'] },
				...spreadIfDefined('maxOutputTokens', context.propsValue.maxOutputTokens),
			},
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
