import { googleGeminiAuth } from '../auth';
import { ApFile, DynamicPropsValue, Property, createAction } from '@activepieces/pieces-framework';
import { defaultLLM, getGeminiModelOptions } from '../common/common';
import { GenerateContentParameters, GoogleGenAI } from '@google/genai';
import { isEmpty } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import mime from 'mime-types';
import { generateContentActionOutputSchema } from '../output-schemas';

export const generateContentAction = createAction({
  audience: 'both',
	description: 'Send a prompt to Gemini and get a text response.',
	aiMetadata: { description: 'Runs a single stateless prompt through a Gemini text model and returns the generated text, optionally grounded by one built-in tool: Google Search for live web results, URL Context to fetch pages named in the prompt, Google Maps scoped to a latitude/longitude, or File Search over an uploaded file. Use this as the default Gemini text-generation call; prefer chat_gemini when the exchange needs conversation memory, generate_content_from_image when the input includes an image, and create_video or text-to-speech for non-text output. Not idempotent: each call produces a fresh completion, and the File Search mode additionally creates a new file search store.', idempotent: false },
	displayName: 'Generate Content',
	name: 'generate_content',
	classification: 'WRITE',
	auth: googleGeminiAuth,
	props: {
		prompt: Property.LongText({
			displayName: 'Prompt',
			required: true,
			description: 'What you want Gemini to write or answer.',
		}),
		model: Property.Dropdown({
			displayName: 'Model',
			required: true,
			description: 'Gemini model that writes the response.',
			refreshers: [],
			defaultValue: defaultLLM,
			auth: googleGeminiAuth,
			options: async ({ auth }) => getGeminiModelOptions({ auth }),
		}),
		toolType: Property.StaticDropdown({
			displayName: 'Built-in Tool',
			description: 'Lets Gemini search Google, read links, use Maps or search a file.',
			required: false,
			options: {
				options: [
					{ label: 'Google Search', value: 'google-search' },
					{ label: 'File Search', value: 'file-search' },
					{ label: 'Google Maps', value: 'google-maps' },
					{ label: 'URL Context', value: 'url-context' },
				],
			},
		}),
		toolProperties: Property.DynamicProperties({
			displayName: 'Tool Settings',
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
								description: 'File Gemini searches to answer the prompt.',
							}),
							fileStoreName: Property.ShortText({
								displayName: 'File Store Name',
								required: true,
								description: 'Name for the search store this step creates on each run.',
							}),
						};
						break;
					case 'url-context':
						props = {
							mrkdown: Property.MarkDown({
								variant: MarkdownVariant.INFO,
								value:
									'Put the links in the prompt. Gemini reads those pages before it answers.',
							}),
						};
						break;
					case 'google-search':
						props = {
							mrkdown: Property.MarkDown({
								variant: MarkdownVariant.INFO,
								value:
									'Gemini searches Google when the prompt needs up-to-date information.',
							}),
						};
						break;
					case 'google-maps':
						props = {
							latitude: Property.Number({
								displayName: 'Latitude',
								required: true,
								description: 'Center of the Maps search, in decimal degrees from -90 to 90.',
							}),
							longitude: Property.Number({
								displayName: 'Longitude',
								required: true,
								description: 'Center of the Maps search, in decimal degrees from -180 to 180.',
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
	outputSchema: generateContentActionOutputSchema,
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
