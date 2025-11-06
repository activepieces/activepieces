import { createAction, Property } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { runwayAuth } from '../common';
import RunwayML from '@runwayml/sdk';
import { z } from 'zod';

export const generateImageFromText = createAction({
	auth: runwayAuth,
	name: 'generate_image_from_text',
	displayName: 'Generate Image From Text',
	description: 'Generates an image using a text prompt via Runway\'s AI models',
	props: {
		model: Property.StaticDropdown({
			displayName: 'Model',
			description: 'AI model to use for image generation',
			required: true,
			options: {
				options: [
					{ label: 'Gen4 Image (High Quality)', value: 'gen4_image' },
					{ label: 'Gen4 Image Turbo (Fast)', value: 'gen4_image_turbo' },
				],
			},
		}),
		promptText: Property.LongText({ 
			displayName: 'Prompt', 
			description: 'Describe what you want to see in the image (max 1000 characters)',
			required: true,
		}),
		ratio: Property.StaticDropdown({
			displayName: 'Image Ratio',
			description: 'Resolution of the output image',
			required: true,
			options: {
				options: [
					{ label: 'HD Landscape (1920x1080)', value: '1920:1080' },
					{ label: 'HD Portrait (1080x1920)', value: '1080:1920' },
					{ label: 'Square (1024x1024)', value: '1024:1024' },
					{ label: 'Wide (1360x768)', value: '1360:768' },
					{ label: 'Square HD (1080x1080)', value: '1080:1080' },
					{ label: 'Standard Wide (1168x880)', value: '1168:880' },
					{ label: 'Standard Landscape (1440x1080)', value: '1440:1080' },
					{ label: 'Standard Portrait (1080x1440)', value: '1080:1440' },
					{ label: 'Ultra Wide (1808x768)', value: '1808:768' },
					{ label: 'Cinema Wide (2112x912)', value: '2112:912' },
					{ label: 'HD 720p (1280x720)', value: '1280:720' },
					{ label: 'HD 720p Portrait (720x1280)', value: '720:1280' },
					{ label: 'Square 720p (720x720)', value: '720:720' },
					{ label: 'Standard (960x720)', value: '960:720' },
					{ label: 'Standard Portrait (720x960)', value: '720:960' },
					{ label: 'Wide 720p (1680x720)', value: '1680:720' },
				],
			},
		}),
		seed: Property.Number({ 
			displayName: 'Seed (Optional)', 
			description: 'Random seed for reproducible results (0-4294967295)',
			required: false,
		}),
		referenceImages: Property.Array({
			displayName: 'Reference Images (Optional)',
			description: 'Up to 3 reference images (required for gen4_image_turbo)',
			required: false,
			properties: {
				uri: Property.ShortText({ 
					displayName: 'Image URL', 
					description: 'HTTPS URL or data URI of the reference image',
					required: true 
				}),
				tag: Property.ShortText({ 
					displayName: 'Tag', 
					description: 'Name to reference this image in your prompt using @tag (3-16 characters, alphanumeric + underscore)',
					required: false 
				}),
			},
		}),
		publicFigureThreshold: Property.StaticDropdown({
			displayName: 'Public Figure Detection',
			description: 'How strict content moderation should be for recognizable public figures',
			required: false,
			defaultValue: 'auto',
			options: {
				options: [
					{ label: 'Auto (Recommended)', value: 'auto' },
					{ label: 'Low (Less Strict)', value: 'low' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		// Zod validation
		await propsValidation.validateZod(propsValue, {
			promptText: z.string().min(1, 'Prompt text cannot be empty').max(1000, 'Prompt text must be 1000 characters or fewer'),
			seed: z.number().min(0, 'Seed must be at least 0').max(4294967295, 'Seed must be at most 4294967295').optional(),
			referenceImages: z.array(z.object({
				uri: z.string().url('Reference image URI must be a valid URL'),
				tag: z.string().min(3, 'Tag must be at least 3 characters').max(16, 'Tag must be at most 16 characters').regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Tag must start with a letter and contain only letters, numbers, and underscores').optional()
			})).max(3, 'Maximum of 3 reference images allowed').optional(),
		});

		// Special validation for gen4_image_turbo
		if (propsValue.model === 'gen4_image_turbo' && (!propsValue.referenceImages || propsValue.referenceImages.length === 0)) {
			throw new Error('gen4_image_turbo requires at least one reference image');
		}

		const apiKey = auth as string;
		const client = new RunwayML({ apiKey });

		const requestBody: any = {
			model: propsValue.model,
			promptText: propsValue.promptText,
			ratio: propsValue.ratio,
		};

		if (propsValue.seed !== undefined) {
			requestBody.seed = propsValue.seed;
		}

		if (propsValue.referenceImages && propsValue.referenceImages.length > 0) {
			requestBody.referenceImages = propsValue.referenceImages;
		}

		if (propsValue.publicFigureThreshold) {
			requestBody.contentModeration = {
				publicFigureThreshold: propsValue.publicFigureThreshold
			};
		}

		try {
			const task = await client.textToImage.create(requestBody);
			
			return {
				success: true,
				taskId: task.id,
			};
		} catch (error: any) {
			throw new Error(`Failed to generate image: ${error.message || 'Unknown error'}`);
		}
	},
});


