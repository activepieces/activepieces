import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';

export const generateImage = createAction({
	name: 'generate_image',
	auth: dumplingAuth,
	displayName: 'Generate Image',
	description: 'Generate images based on a text prompt using AI.',
	props: {
		model: Property.StaticDropdown({
			displayName: 'Model',
			required: true,
			description: 'The model to use for image generation',
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
			description: 'The text prompt for image generation',
		}),
		aspect_ratio: Property.StaticDropdown({
			displayName: 'Aspect Ratio',
			required: false,
			description: 'Aspect ratio of the generated image',
			defaultValue: '1:1',
			options: {
				options: [
					{ label: 'Square (1:1)', value: '1:1' },
					{ label: 'Landscape 16:9', value: '16:9' },
					{ label: 'Landscape 21:9', value: '21:9' },
					{ label: 'Landscape 3:2', value: '3:2' },
					{ label: 'Landscape 4:3', value: '4:3' },
					{ label: 'Portrait 2:3', value: '2:3' },
					{ label: 'Portrait 3:4', value: '3:4' },
					{ label: 'Portrait 4:5', value: '4:5' },
					{ label: 'Portrait 9:16', value: '9:16' },
					{ label: 'Portrait 9:21', value: '9:21' },
				],
			},
		}),
		num_outputs: Property.Number({
			displayName: 'Number of Images',
			required: false,
			defaultValue: 1,
			description: 'Number of images to generate (1-4)',
		}),
		seed: Property.Number({
			displayName: 'Seed',
			required: false,
			description: 'Seed for reproducible results',
		}),
		output_format: Property.StaticDropdown({
			displayName: 'Output Format',
			required: false,
			description: 'Format of the generated image',
			defaultValue: 'webp',
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

		// Prepare the input object based on the selected model
		const input: Record<string, any> = {
			prompt: prompt,
		};

		// Add common optional parameters
		if (seed !== undefined) input['seed'] = seed;
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
				Authorization: `Bearer ${context.auth}`,
			},
			body: requestBody,
		});

		return response.body;
	},
});
