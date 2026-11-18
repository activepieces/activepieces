import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { PlacidClient } from './client';
import { placidAuth } from '../auth';
import { PlacidTemplate } from './index';

function matchScore({ template, outputType }: { template: PlacidTemplate; outputType: 'image' | 'pdf' | 'video' }): number {
	const title = template.title.toLowerCase();
	const tags = (template.tags ?? []).map((tag) => tag.toLowerCase());
	return title.includes(outputType) || tags.includes(outputType) || tags.includes(`${outputType}s`) ? 1 : 0;
}

const createTemplateDropdown = (outputType?: 'image' | 'pdf' | 'video') =>
	Property.Dropdown({
		auth: placidAuth,
		displayName: 'Template',
		description: `Select a Placid template${outputType ? ` for ${outputType === 'pdf' ? 'PDF' : outputType} generation` : ''}`,
		required: true,
		refreshers: ['auth'],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first',
				};
			}

			try {
				const client = new PlacidClient(auth);
				const { templates, truncated } = await client.listTemplates();

				if (templates.length === 0) {
					return {
						options: [],
						placeholder: 'No templates found in your Placid project',
					};
				}

				const sorted = outputType
					? [...templates].sort((a, b) => matchScore({ template: b, outputType }) - matchScore({ template: a, outputType }))
					: templates;

				return {
					options: sorted.map((template) => ({
						label: template.title,
						value: template.uuid,
					})),
					...(truncated ? { placeholder: 'Showing the first 500 templates; map a template UUID for others' } : {}),
				};
			} catch (error) {
				return {
					disabled: true,
					options: [],
					placeholder: `Failed to load templates: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`,
				};
			}
		},
	});

export const templateDropdown = createTemplateDropdown();

export const imageTemplateDropdown = createTemplateDropdown('image');
export const pdfTemplateDropdown = createTemplateDropdown('pdf');
export const videoTemplateDropdown = createTemplateDropdown('video');

export const modificationsProperty = Property.Object({
	displayName: 'Modifications',
	description: 'Optional modifications to the generated image (width, height, filename)',
	required: false,
});

export const webhookProperty = Property.ShortText({
	displayName: 'Webhook URL',
	description: 'Optional webhook URL to receive notification when generation is complete.',
	required: false,
});

export const createNowProperty = (outputName: string) =>
	Property.Checkbox({
		displayName: 'Create Now',
		description: `Whether to create the ${outputName} immediately (synchronous) or queue it (asynchronous).`,
		required: false,
		defaultValue: false,
	});

export const passthroughProperty = Property.ShortText({
	displayName: 'Passthrough Text',
	description: 'Any text returned unchanged with the result, e.g. your record ID.',
	placeholder: 'record-123',
	required: false,
});

export const templateLayersProperty = (type: string) =>
	Property.DynamicProperties({
		auth: placidAuth,
		displayName: 'Layers',
		refreshers: ['template'],
		required: false,
		props: async ({ auth, template }) => {
			if (!auth || !template) return {};

			const props: DynamicPropsValue = {};

			const client = new PlacidClient(auth);
			if (typeof template !== 'string') return {};
			const response = await client.getTemplate(template);

			for (const layer of response.layers ?? []) {
				switch (layer.type) {
					case 'text': {
						props[`${layer.name}:::text`] = Property.ShortText({
							displayName: `${layer.name} : Text`,
							description: 'Text to show in this layer.',
							required: false,
						});
						props[`${layer.name}:::text_color`] = Property.ShortText({
							displayName: `${layer.name} : Text Color`,
							description: 'Hex color, e.g. #FF5733',
							placeholder: '#FF5733',
							required: false,
						});
						props[`${layer.name}:::font`] = Property.ShortText({
							displayName: `${layer.name} : Text Font`,
							required: false,
						});
						props[`${layer.name}:::alt_text_color`] = Property.ShortText({
							displayName: `${layer.name} : Alternate Text Color`,
							description: 'Hex color, e.g. #FF5733',
							placeholder: '#FF5733',
							required: false,
						});
						props[`${layer.name}:::alt_font`] = Property.ShortText({
							displayName: `${layer.name} : Alternate Text Font`,
							required: false,
						});
						props[`${layer.name}:::hide`] = Property.Checkbox({
							displayName: `${layer.name} : Hide Layer`,
							description: 'Hide this layer.',
							required: false,
						});
						break;
					}
					case 'shape': {
						props[`${layer.name}:::background_color`] = Property.ShortText({
							displayName: `${layer.name} : Background Color`,
							description: 'Hex color, e.g. #FF5733',
							placeholder: '#FF5733',
							required: false,
						});
						props[`${layer.name}:::hide`] = Property.Checkbox({
							displayName: `${layer.name} : Hide Layer`,
							description: 'Hide this layer.',
							required: false,
						});
						break;
					}
					case 'picture': {
						if (type === 'video') {
							props[`${layer.name}:::video`] = Property.ShortText({
								displayName: `${layer.name} : Video`,
							description: 'Public video URL.',
							placeholder: 'https://example.com/clip.mp4',
								required: false,
							});
						}
						props[`${layer.name}:::image`] = Property.ShortText({
							displayName: `${layer.name} : Image`,
							description: 'Public image URL (use Convert File to URL for a file).',
							placeholder: 'https://example.com/photo.png',
							required: false,
						});

						props[`${layer.name}:::hide`] = Property.Checkbox({
							displayName: `${layer.name} : Hide Layer`,
							description: 'Hide this layer.',
							required: false,
						});
						break;
					}
					case 'browserframe': {
						props[`${layer.name}:::image`] = Property.ShortText({
							displayName: `${layer.name} : Image`,
							description: 'Public image URL (use Convert File to URL for a file).',
							placeholder: 'https://example.com/photo.png',
							required: false,
						});
						props[`${layer.name}:::url`] = Property.ShortText({
							displayName: `${layer.name} : URL Text`,
							required: false,
						});
						props[`${layer.name}:::hide`] = Property.Checkbox({
							displayName: `${layer.name} : Hide Layer`,
							description: 'Hide this layer.',
							required: false,
						});
						break;
					}
					case 'barcode': {
						props[`${layer.name}:::value`] = Property.ShortText({
							displayName: `${layer.name} : Value`,
							required: false,
						});
						props[`${layer.name}:::color`] = Property.ShortText({
							displayName: `${layer.name} : Color`,
							description: 'Hex color, e.g. #FF5733',
							placeholder: '#FF5733',
							required: false,
						});
						props[`${layer.name}:::hide`] = Property.Checkbox({
							displayName: `${layer.name} : Hide Layer`,
							description: 'Hide this layer.',
							required: false,
						});
						break;
					}
					case 'rating': {
						props[`${layer.name}:::value`] = Property.ShortText({
							displayName: `${layer.name} : Value`,
							required: false,
						});
						props[`${layer.name}:::hide`] = Property.Checkbox({
							displayName: `${layer.name} : Hide Layer`,
							description: 'Hide this layer.',
							required: false,
						});
						break;
					}
					default:
						break;
				}
			}

			return props;
		},
	});

export const templateUuidText = Property.ShortText({
	displayName: 'Template UUID',
	description: 'UUID of the Placid template. Get it from List Templates (AI).',
	required: true,
});

export const aiLayersJson = Property.Json({
	displayName: 'Layers',
	description:
		'JSON object keyed by layer name, each value an object of layer properties. Example: {"title": {"text": "Hello"}, "photo": {"image": "https://example.com/a.png"}}. Get layer names from Get Template (AI).',
	required: false,
});

export const waitForResultDropdown = Property.StaticDropdown<string>({
	displayName: 'Wait for Result',
	description: 'yes: wait up to 5 minutes for the finished file URL. no: queue the render and return its ID right away.',
	required: false,
	defaultValue: 'yes',
	options: {
		disabled: false,
		options: [
			{ label: 'Yes', value: 'yes' },
			{ label: 'No', value: 'no' },
		],
	},
});

export const aiFilenameText = Property.ShortText({
	displayName: 'File Name',
	description: 'Optional output file name.',
	required: false,
});

export const aiPassthroughText = Property.ShortText({
	displayName: 'Passthrough',
	description: 'Optional text (max 1024 characters) returned unchanged with the render.',
	required: false,
});

export const renderIdText = (label: string) =>
	Property.ShortText({
		displayName: `${label} ID`,
		description: `ID of the ${label} render, as returned by the create action.`,
		required: true,
	});
