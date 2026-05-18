import { openaiAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { notLLMs } from '../common/common';

export const extractStructuredDataAction = createAction({
	auth: openaiAuth,
	name: 'extract_structured_data',
	displayName: 'Extract Structured Data',
	description: 'Extract structured data from text using OpenAI.',
	props: {
		baseUrl: Property.ShortText({
			displayName: 'Base URL',
			description: 'The base URL for the OpenAI API. Default is https://api.openai.com/v1',
			required: false,
		}),
		model: Property.Dropdown({
			displayName: 'Model',
			required: true,
			description: 'The model which will generate the completion.',
			refreshers: ['baseUrl'],
			defaultValue: 'gpt-3.5-turbo',
			options: async ({ auth, propsValue }) => {
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
						baseURL: (propsValue['baseUrl'] as string) || undefined,
					});
					const response = await openai.models.list();
					// We need to get only LLM models
					const models = response.data.filter(
						(model) => !notLLMs.includes(model.id)
					);
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
			displayName: 'Text',
			description: 'The text to extract data from.',
			required: true,
		}),
		extractionSchema: Property.Array({
			displayName: 'Extraction Schema',
			description: 'The schema for the data to be extracted.',
			required: true,
			properties: {
				propName: Property.ShortText({
					displayName: 'Property Name',
					description: 'The name of the property to be extracted.',
					required: true,
				}),
				propDescription: Property.ShortText({
					displayName: 'Property Description',
					description: 'The description of the property to be extracted.',
					required: true,
				}),
				propDataType: Property.StaticDropdown({
					displayName: 'Property Data Type',
					description: 'The data type of the property to be extracted.',
					required: true,
					options: {
						options: [
							{ label: 'String', value: 'string' },
							{ label: 'Number', value: 'number' },
							{ label: 'Boolean', value: 'boolean' },
						],
					},
				}),
				propIsRequired: Property.Checkbox({
					displayName: 'Is Required',
					description: 'Whether the property is required.',
					required: true,
					defaultValue: true,
				}),
			},
		}),
	},
	async run(context) {
		const { model, text, extractionSchema, baseUrl } = context.propsValue;

		const properties: Record<string, any> = {};
		const required: string[] = [];

		(extractionSchema as ParamInput[]).forEach((param) => {
			properties[param.propName] = {
				type: param.propDataType,
				description: param.propDescription,
			};
			if (param.propIsRequired) {
				required.push(param.propName);
			}
		});

		const prompt = 'Extract the following data from the provided text'
		const openai = new OpenAI({
			apiKey: context.auth as string,
			baseURL: baseUrl || undefined,
		});

		const response = await openai.chat.completions.create({
			model: model,
			messages: [
				{
					role: 'system',
					content: 'You are a helpful assistant that extracts data from text.',
				},
				{
					role: 'user',
					content: `${prompt}:\n\n${text}`,
				},
			],
			functions: [
				{
					name: 'extract_data',
					description: 'Extract data from text',
					parameters: {
						type: 'object',
						properties,
						required,
					},
				},
			],
			function_call: { name: 'extract_data' },
		});

		const extractedData = response.choices[0].message.function_call?.arguments;

		if (extractedData) {
			return JSON.parse(extractedData);
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
