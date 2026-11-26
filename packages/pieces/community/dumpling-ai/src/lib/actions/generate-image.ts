import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../auth';

export const generateImage = createAction({
	name: 'generate_image',
	classification: 'READ',
	auth: dumplingAuth,
	displayName: 'Generate Image',
	description: 'Generate images based on a text prompt using AI.',
	audience: 'both',
	aiMetadata: { description: 'Generates one or more images from a text prompt using a selectable FLUX or recraft model on Dumpling AI, with optional aspect ratio, output format, image count, and seed. Use when the agent needs to create images from a description. Not idempotent: each call is a fresh billed generation; even with a fixed seed it produces new output and consumes credits.', idempotent: false },
	propertyGroups: [
		{ key: 'image', display: 'section', label: 'Image', icon: 'text', props: ['model', 'prompt'] },
		{ key: 'settings', display: 'section', label: 'Settings', icon: 'sliders', props: ['aspect_ratio', 'output_format', 'num_outputs'] },
	],
	props: {
		model: Property.StaticDropdown({
			displayName: 'Model',
			required: true,
			defaultValue: 'FLUX.1-schnell',
			options: {
				options: [
					{ label: 'FLUX.1-schnell', value: 'FLUX.1-schnell' },
					{ label: 'FLUX.1-dev', value: 'FLUX.1-dev' },
					{ label: 'FLUX.1-pro', value: 'FLUX.1-pro' },
					{ label: 'FLUX.1.1-pro', value: 'FLUX.1.1-pro' },
					{ label: 'recraft-v3', value: 'recraft-v3' },
				],
			},
		}),
		prompt: Property.LongText({
			displayName: 'Prompt',
			required: true,
			description: 'Describe the image you want.',
			placeholder: 'A watercolor fox in a snowy forest',
		}),
		aspect_ratio: Property.StaticDropdown({
			displayName: 'Aspect Ratio',
			required: false,
			description: 'Pro models skip 21:9 and 9:21; recraft-v3 ignores this.',
			defaultValue: '1:1',
			width: 'half',
			options: {
				options: [
					{ label: 'Square (1:1)', value: '1:1' },
					{ label: 'Landscape (16:9)', value: '16:9' },
					{ label: 'Landscape (21:9)', value: '21:9' },
					{ label: 'Landscape (3:2)', value: '3:2' },
					{ label: 'Landscape (4:3)', value: '4:3' },
					{ label: 'Portrait (2:3)', value: '2:3' },
					{ label: 'Portrait (3:4)', value: '3:4' },
					{ label: 'Portrait (4:5)', value: '4:5' },
					{ label: 'Portrait (9:16)', value: '9:16' },
					{ label: 'Portrait (9:21)', value: '9:21' },
				],
			},
		}),
		num_outputs: Property.Number({
			displayName: 'Number of Images',
			required: false,
			defaultValue: 1,
			description: 'How many images to make, 1 to 4 (FLUX.1-schnell and FLUX.1-dev only).',
		}),
		seed: Property.Number({
			displayName: 'Seed',
			required: false,
			advanced: true,
			description: 'Reuse the same number to get similar results again.',
		}),
		output_format: Property.StaticDropdown({
			displayName: 'Output Format',
			required: false,
			defaultValue: 'webp',
			width: 'half',
			options: {
				options: [
					{ label: 'WebP', value: 'webp' },
					{ label: 'JPG', value: 'jpg' },
					{ label: 'PNG', value: 'png' },
				],
			},
		}),
	},
	async run(context) {
		const { model, prompt, aspect_ratio, num_outputs, seed, output_format } = context.propsValue;

		const input: Record<string, unknown> = {
			prompt: prompt,
		};

		if (!isNil(seed)) input['seed'] = seed;
		if (aspect_ratio) input['aspect_ratio'] = aspect_ratio;
		if (num_outputs) input['num_outputs'] = num_outputs;
		if (output_format) input['output_format'] = output_format;

		const requestBody = {
			model: model,
			input: input,
		};

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: 'https://app.dumplingai.com/api/v1/generate-ai-image',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${context.auth.secret_text}`,
			},
			body: requestBody,
		});

		return response.body;
	},
});
