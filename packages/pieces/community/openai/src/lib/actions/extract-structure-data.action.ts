import { openaiAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { notLLMs } from '../common/common';

export const extractStructureDataAction = createAction({
	auth: openaiAuth,
	name: 'openai-extract-structure-data',
	displayName: 'Transform Text to Structure Data',
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
		prompt: Property.LongText({
			displayName: 'Prompt',
			description:
				'Provide a brief description of what sort of data you want extracted from the unstructured text.',
			required: true,
		}),
		params: Property.Array({
			displayName: 'Structured Data Definition',
			required: true,
			properties: {
				propName: Property.ShortText({
					displayName: 'Name',
					description:
						'Provide the name of the values you want to extract from the unstructured text. Name should be unique and short. ',
					required: true,
				}),
				propDescription: Property.LongText({
					displayName: 'Description',
					description:
						'Brief description of the parameter, defining what data will be extracted to this parameter.',
					required: true,
				}),
				propDataType: Property.StaticDropdown({
					displayName: 'Data Type',
					description: 'Type of parameter.',
					required: true,
					defaultValue: 'string',
					options: {
						disabled: false,
						options: [
							{ label: 'string', value: 'string' },
							{ label: 'number', value: 'number' },
							{ label: 'boolean', value: 'boolean' },
						],
					},
				}),
				propIsRequired: Property.Checkbox({
					displayName: 'Is Parameter Required?',
					required: true,
					defaultValue: true,
				}),
			},
		}),
	},
	async run(context) {
		try {
			const { model, text, prompt } = context.propsValue;

			const paramInputArray = context.propsValue.params as ParamInput[];

			const functionParams: Record<string, any> = {};
			const requiredFunctionParams = [];
			for (const param of paramInputArray) {
				functionParams[param.propName] = {
					type: param.propDataType,
					description: param.propDescription,
				};
				if (param.propIsRequired) requiredFunctionParams.push(param.propName);
			}

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
				return response.choices[0].message;
			}
		} catch (error) {
			throw Error(JSON.stringify(error, null, 2));
		}
	},
});

interface ParamInput {
	propName: string;
	propDescription: string;
	propDataType: string;
	propIsRequired: boolean;
}
