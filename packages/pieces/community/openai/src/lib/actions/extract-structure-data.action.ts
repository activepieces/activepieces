import { openaiAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import {
	functionToolParams,
	isLLM,
	rejectsFunctionTools,
	resolveModelId,
} from '../common/common';

export const extractStructuredDataAction = createAction({
  audience: 'both',
	auth: openaiAuth,
	name: 'extract-structured-data',
	classification: 'READ',
	displayName: 'Extract Structured Data',
	description: 'Pull the fields you define out of a block of text.',
	aiMetadata: { description: 'Pulls a caller-defined set of named fields out of one block of unstructured text and returns them as a flat object, with each field declared as text, number, or boolean and optionally marked to fail the step when it is absent. Use it to turn prose, emails, or documents into machine-readable values; prefer analyze_sentiment or classify_text for a judgement about the text and ask_chatgpt for free-form output. Requires the text plus at least one field definition, and the step errors when the model returns no extraction at all. Not idempotent: each call is a fresh model completion and the extracted values can vary between runs.', idempotent: false },
	propertyGroups: [
		{ key: 'source', display: 'section', label: 'Source', icon: 'text', props: ['model', 'text'] },
		{ key: 'output', display: 'section', label: 'Output', icon: 'tag', props: ['params'] },
	],
	props: {
		model: Property.Dropdown({
  auth: openaiAuth,
			displayName: 'Model',
			description: 'The OpenAI model that reads the text.',
			required: true,
			refreshers: [],
			defaultValue: 'gpt-3.5-turbo',
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Enter your API key first',
						options: [],
					};
				}
				try {
					const openai = new OpenAI({
						apiKey: auth.secret_text,
					});
					const response = await openai.models.list();
					const models = response.data.filter((model) => isLLM(model.id));
					return {
						disabled: false,
						options: models.map((model) => {
							return {
								label: model.id,
								value: model.id,
							};
						}),
					};
				} catch (error) {
					return {
						disabled: true,
						options: [],
						placeholder: "Couldn't load models. Check your API key or try again.",
					};
				}
			},
		}),
		text: Property.LongText({
			displayName: 'Text',
			description: 'The text to pull the fields from.',
			required: true,
		}),
		params: Property.Array({
			displayName: 'Fields',
			description: 'One row per value you want back.',
			required: true,
			properties: {
				propName: Property.ShortText({
					displayName: 'Name',
					description: 'Short, unique name for this value in the output.',
					placeholder: 'e.g. invoice_total',
					required: true,
				}),
				propDescription: Property.LongText({
					displayName: 'Description',
					description: 'Tells the AI what to look for.',
					placeholder: 'e.g. Total due, including tax',
					required: false,
				}),
				propDataType: Property.StaticDropdown({
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
				propIsRequired: Property.Checkbox({
					displayName: 'Required',
					description:
						'Asks the AI to always fill this field. The step does not check it.',
					required: true,
					defaultValue: false,
				}),
			},
		}),
	},
	async run(context) {
		const model = resolveModelId(context.propsValue.model);
		const { text } = context.propsValue;
		const paramInputArray = context.propsValue.params as ParamInput[];
		const functionParams: Record<string, unknown> = {};
		const requiredFunctionParams: string[] = [];
		for (const param of paramInputArray) {
			functionParams[param.propName] = {
				type: param.propDataType,
				description: param.propDescription ?? param.propName,
			};
			if (param.propIsRequired) {
				requiredFunctionParams.push(param.propName);
			}
		}
		const prompt = 'Extract the following data from the provided text'
		const openai = new OpenAI({
			apiKey: context.auth.secret_text,
		});

		const schema = {
			type: 'object',
			properties: functionParams,
			required: requiredFunctionParams,
		};

		if (rejectsFunctionTools(model)) {
			const response = await openai.chat.completions.create({
				model: model,
				messages: [
					{ role: 'system', content: prompt },
					{ role: 'user', content: text },
				],
				response_format: {
					type: 'json_schema',
					json_schema: {
						name: 'extract_structured_data',
						schema,
						strict: false,
					},
				},
			});
			const message = response.choices[0].message;
			if (!message.content) {
				throw new Error(JSON.stringify({
					message: "OpenAI couldn't extract the fields from the above text.",
					refusal: message.refusal ?? undefined,
					finishReason: response.choices[0].finish_reason,
				}));
			}
			const content = message.content;
			return parseExtraction(content);
		}

		const response = await openai.chat.completions.create({
			model: model,
			...functionToolParams(model),
			messages: [{ role: 'user', content: text }],
			tools: [
				{
					type: 'function',
					function: {
						name: 'extract_structured_data',
						description: prompt,
						parameters: schema,
					},
				},
			],
		});

		const toolCallsResponse = response.choices[0].message.tool_calls;
		if (!toolCallsResponse || toolCallsResponse.length === 0) {
			throw new Error(JSON.stringify({
				message: "OpenAI couldn't extract the fields from the above text."
			}));
		}
		return parseExtraction(toolCallsResponse[0].function.arguments);
	},
});

function parseExtraction(raw: string): unknown {
	try {
		return JSON.parse(raw);
	} catch {
		throw new Error(JSON.stringify({
			message: 'OpenAI returned invalid JSON for the extracted fields.',
			raw,
		}));
	}
}

interface ParamInput {
	propName: string;
	propDescription: string;
	propDataType: string;
	propIsRequired: boolean;
}
