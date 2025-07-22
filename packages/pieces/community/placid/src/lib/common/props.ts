import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { PlacidClient } from './client';

const createTemplateDropdown = (outputType?: 'image' | 'pdf' | 'video') =>
	Property.Dropdown({
		displayName: 'Template',
		description: `Select a Placid template${outputType ? ` for ${outputType} generation` : ''}`,
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
				const client = new PlacidClient(auth as string);
				const templates = await client.listTemplates();

				if (!templates || templates.length === 0) {
					return {
						options: [],
						placeholder: 'No templates found in your Placid project',
					};
				}

				// Filter templates by tags or naming if outputType is specified
				let filteredTemplates = templates;
				if (outputType) {
					filteredTemplates = templates.filter((template) => {
						const title = template.title.toLowerCase();
						const tags = template.tags?.map((tag) => tag.toLowerCase()) || [];

						// Check if template title or tags indicate it's for this output type
						return (
							title.includes(outputType) ||
							tags.includes(outputType) ||
							tags.includes(`${outputType}s`) ||
							// For backwards compatibility, if no specific filtering matches, include all
							(!title.includes('image') &&
								!title.includes('pdf') &&
								!title.includes('video') &&
								!tags.some((tag) =>
									['image', 'pdf', 'video', 'images', 'pdfs', 'videos'].includes(tag),
								))
						);
					});
				}

				// If filtering resulted in no templates, show all templates with a note
				if (outputType && filteredTemplates.length === 0) {
					filteredTemplates = templates;
				}

				return {
					options: filteredTemplates.map((template) => {
						return {
							label: template.title,
							value: template.uuid,
						};
					}),
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

// General template dropdown for all types
export const templateDropdown = createTemplateDropdown();

// Specific template dropdowns for each output type
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

export const createNowProperty = Property.Checkbox({
	displayName: 'Create Now',
	description: 'Whether to create the image immediately (synchronous) or queue it (asynchronous).',
	required: false,
	defaultValue: false,
});

export const passthroughProperty = Property.ShortText({
	displayName: 'Passthrough Text',
	required: false,
});

export const templateLayersProperty = (type: string) =>
	Property.DynamicProperties({
		displayName: 'Layers',
		refreshers: ['template'],
		required: false,
		props: async ({ auth, template }) => {
			if (!auth || !template) return {};

			const props: DynamicPropsValue = {};

			const client = new PlacidClient(auth as unknown as string);
			const response = await client.getTemplate(template as unknown as string);

			for (const layer of response.layers) {
				switch (layer.type) {
					case 'text': {
						props[`${layer.name}:::text`] = Property.ShortText({
							displayName: `${layer.name} : Text`,
							required: false,
						});
						props[`${layer.name}:::text_color`] = Property.ShortText({
							displayName: `${layer.name} : Text Color`,
							required: false,
						});
						props[`${layer.name}:::font`] = Property.ShortText({
							displayName: `${layer.name} : Text Font`,
							required: false,
						});
						props[`${layer.name}:::alt_text_color`] = Property.ShortText({
							displayName: `${layer.name} : Alternate Text Color`,
							required: false,
						});
						props[`${layer.name}:::alt_font`] = Property.ShortText({
							displayName: `${layer.name} : Alternate Text Font`,
							required: false,
						});
						props[`${layer.name}:::hide`] = Property.Checkbox({
							displayName: `${layer.name} : Hide Layer`,
							required: false,
						});
						break;
					}
					case 'shape': {
						props[`${layer.name}:::background_color`] = Property.ShortText({
							displayName: `${layer.name} : Background Color`,
							required: false,
						});
						props[`${layer.name}:::hide`] = Property.Checkbox({
							displayName: `${layer.name} : Hide Layer`,
							required: false,
						});
						break;
					}
					case 'picture': {
						if (type === 'video') {
							props[`${layer.name}:::video`] = Property.ShortText({
								displayName: `${layer.name} : Video`,
								required: false,
							});
						}
						props[`${layer.name}:::image`] = Property.ShortText({
							displayName: `${layer.name} : Image`,
							required: false,
						});

						props[`${layer.name}:::hide`] = Property.Checkbox({
							displayName: `${layer.name} : Hide Layer`,
							required: false,
						});
						break;
					}
					case 'browserframe': {
						props[`${layer.name}:::image`] = Property.ShortText({
							displayName: `${layer.name} : Image`,
							required: false,
						});
						props[`${layer.name}:::url`] = Property.ShortText({
							displayName: `${layer.name} : URL Text`,
							required: false,
						});
						props[`${layer.name}:::hide`] = Property.Checkbox({
							displayName: `${layer.name} : Hide Layer`,
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
							required: false,
						});
						props[`${layer.name}:::hide`] = Property.Checkbox({
							displayName: `${layer.name} : Hide Layer`,
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
