import { googleGeminiAuth } from '../auth';
import { ApFile, DynamicPropsValue, Property, createAction } from '@activepieces/pieces-framework';
import { defaultLLM, getGeminiModelOptions } from '../common/common';
import { GenerateContentParameters, GoogleGenAI } from '@google/genai';
import { isEmpty, MarkdownVariant } from '@activepieces/shared';
import mime from 'mime-types';

export const generateContentAction = createAction({
	description: 'Generate content using Google Gemini using the "gemini-pro" model',
	displayName: 'Generate Content',
	name: 'generate_content',
	auth: googleGeminiAuth,
	props: {
		prompt: Property.LongText({
			displayName: 'Prompt',
			required: true,
			description: 'The prompt to generate content from.',
		}),
		model: Property.Dropdown({
			displayName: 'Model',
			required: true,
			description: 'The model which will generate the completion',
			refreshers: [],
			defaultValue: defaultLLM,
			auth: googleGeminiAuth,
			options: async ({ auth }) => getGeminiModelOptions({ auth }),
		}),
		toolType: Property.StaticDropdown({
			displayName: 'Tool Type',
			description: 'Select built-in tool to use with Gemini model.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Google Search', value: 'google-search' },
					{ label: 'File Search', value: 'file-search' },
					{ label: 'Google Maps', value: 'google-maps' },
					{ label: 'URL Context', value: 'url-context' },
				],
			},
		}),
		toolProperties: Property.DynamicProperties({
			displayName: 'Tool Config',
			auth: googleGeminiAuth,
			refreshers: ['toolType'],
			required: false,
			props: async ({ auth, toolType }) => {
				if (!auth || !toolType) return {};

				let props: DynamicPropsValue = {};

				switch (toolType) {
					case 'file-search':
						props = {
							file: Property.File({
								displayName: 'File',
								required: true,
								description: 'File to use for search tool.',
							}),
							fileStoreName: Property.ShortText({
								displayName: 'File Store Name',
								required: true,
							}),
						};
						break;
					case 'url-context':
						props = {
							mrkdown: Property.MarkDown({
								variant: MarkdownVariant.INFO,
								value:
									'To use URL context tool, include one or more URLs directly in the prompt. Gemini will fetch and use the page content as additional context.',
							}),
						};
						break;
					case 'google-search':
						props = {
							mrkdown: Property.MarkDown({
								variant: MarkdownVariant.INFO,
								value:
									'To use Google Search tool, include a clear search query in the prompt. Gemini will use Google Search to retrieve up-to-date web information.',
							}),
						};
						break;
					case 'google-maps':
						props = {
							latitude: Property.Number({
								displayName: 'Latitude',
								required: true,
								description: 'Provide the relevant location latitude.',
							}),
							longitude: Property.Number({
								displayName: 'Longitude',
								required: true,
								description: 'Provide the relevant location longitude.',
							}),
						};
						break;
					default:
						break;
				}
				return props;
			},
		}),
	},
	async run({ auth, propsValue }) {
		const { model, prompt, toolType } = propsValue;
		const toolProperties = propsValue.toolProperties ?? {};

		const genAI = new GoogleGenAI({ apiKey: auth.secret_text });

		const params: GenerateContentParameters = {
			model,
			contents: prompt,
		};

		const generate = async () => {
			const response = await genAI.models.generateContent(params);
			return response.text;
		};

		if (isEmpty(toolType)) {
			return generate();
		}

		switch (toolType) {
			case 'file-search': {
				const { file, fileStoreName } = toolProperties as { file: ApFile; fileStoreName: string };

				const fileBlob = new Blob([Buffer.from(file.base64, 'base64')], {
					type: mime.lookup(file.extension || file.filename) || undefined,
				});

				const fileSearchStore = await genAI.fileSearchStores.create({
					config: { displayName: fileStoreName },
				});

				let operation = await genAI.fileSearchStores.uploadToFileSearchStore({
					file: fileBlob,
					fileSearchStoreName: fileSearchStore.name!,
					config: {
						displayName: file.filename,
					},
				});
				while (!operation.done) {
					await new Promise((resolve) => setTimeout(resolve, 5000));
					operation = await genAI.operations.get({ operation });
				}

				params.config = {
					tools: [
						{
							fileSearch: {
								fileSearchStoreNames: [fileSearchStore.name!],
							},
						},
					],
				};

				break;
			}
			case 'url-context': {
				params.config = {
					tools: [{ urlContext: {} }],
				};
				break;
			}
			case 'google-search': {
				params.config = {
					tools: [{ googleSearch: {} }],
				};
				break;
			}
			case 'google-maps': {
				const { latitude, longitude } = toolProperties as { latitude: number; longitude: number };

				params.config = {
					tools: [{ googleMaps: {} }],
					toolConfig: {
						retrievalConfig: {
							latLng: {
								latitude,
								longitude,
							},
						},
					},
				};

				break;
			}
		}

		return generate();
	},
});
