import { openaiAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { notLLMs } from '../common/common';

export const extractStructuredDataAction = createAction({
	auth: openaiAuth,
	name: 'extract-structured-data',
	displayName: 'Extract Structured Data from Text',
	description: 'Returns structured data from provided unstructured text.',
	props: {
		model: Property.Dropdown({
			displayName: 'Model',
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
						apiKey: auth as string,
					});
					const response = await openai.models.list();
					// We need to get only LLM models
					const models = response.data.filter((model) => !notLLMs.includes(model.id));
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
						placeholder: "Couldn't load models, API key is invalid",
					};
				}
			},
		}),
		text: Property.LongText({
			displayName: 'Unstructured Text',
			required: true,
		}),
		params: Property.Array({
			displayName: 'Data Definition',
			required: true,
			properties: {
				propName: Property.ShortText({
					displayName: 'Name',
					description:
						'Provide the name of the value you want to extract from the unstructured text. The name should be unique and short. ',
					required: true,
				}),
				propDescription: Property.LongText({
					displayName: 'Description',
					description:
						'Brief description of the data, this hints for the AI on what to look for',
					required: false,
				}),
				propDataType: Property.StaticDropdown({
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
				propIsRequired: Property.Checkbox({
					displayName: 'Fail if Not present?',
					required: true,
					defaultValue: false,
				}),
			},
		}),
	},
	async run(context) {
		const { model, text } = context.propsValue;
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
			apiKey: context.auth,
		});

		const response = await openai.chat.completions.create({
			model: model,
			messages: [{ role: 'user', content: text }],
			tools: [
				{
					type: 'function',
					function: {
						name: 'extract_structured_data',
						description: prompt,
						parameters: {
							type: 'object',
							properties: functionParams,
							required: requiredFunctionParams,
						},
					},
				},
			],
		});

		const toolCallsResponse = response.choices[0].message.tool_calls;
		if (toolCallsResponse) {
			return JSON.parse(toolCallsResponse[0].function.arguments);
		} else {
			throw new Error(JSON.stringify({
				message: "OpenAI couldn't extract the fields from the above text."
			}));
		}
	},
});

interface ParamInput {
	propName: string;
	propDescription: string;
	propDataType: string;
	propIsRequired: boolean;
}
