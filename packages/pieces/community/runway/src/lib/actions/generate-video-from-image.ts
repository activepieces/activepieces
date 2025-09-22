import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { runwayAuth } from '../common';
import RunwayML from '@runwayml/sdk';
import { z } from 'zod';

export const generateVideoFromImage = createAction({
	auth: runwayAuth,
	name: 'generate_video_from_image',
	displayName: 'Generate Video From Image',
	description: 'Generates a video based on image(s) and text prompt using Runway\'s AI models',
	props: {
		model: Property.StaticDropdown({
			displayName: 'Model',
			description: 'AI model to use for video generation',
			required: true,
			options: {
				options: [
					{ label: 'Gen4 Turbo (Fast, High Quality)', value: 'gen4_turbo' },
					{ label: 'Gen3a Turbo (Balanced)', value: 'gen3a_turbo' },
					{ label: 'Veo3 (Google\'s Latest)', value: 'veo3' },
				],
			},
		}),
		promptImageFile: Property.File({ 
			displayName: 'Prompt Image File', 
			description: 'Upload an image file to use as the video\'s starting frame',
			required: false 
		}),
		promptImageUrl: Property.ShortText({ 
			displayName: 'Prompt Image URL', 
			description: 'HTTPS URL of an image to use as the video\'s starting frame',
			required: false 
		}),
		imagePosition: Property.StaticDropdown({
			displayName: 'Image Position',
			description: 'Position of the image in the video (last frame only supported by gen3a_turbo)',
			required: false,
			defaultValue: 'first',
			options: {
				options: [
					{ label: 'First Frame', value: 'first' },
					{ label: 'Last Frame (gen3a_turbo only)', value: 'last' },
				],
			},
		}),
		promptText: Property.LongText({ 
			displayName: 'Prompt Text (Optional)', 
			description: 'Describe what should happen in the video (max 1000 characters)',
			required: false 
		}),
		ratio: Property.DynamicProperties({
			displayName: 'Video Resolution',
			description: 'Available resolutions depend on the selected model',
			required: true,
			refreshers: ['model'],
			props: async ({ model }) => {
				const ratioOptions: DynamicPropsValue = {};
				
				if ((model as unknown as string) === 'gen4_turbo') {
					ratioOptions['ratio'] = Property.StaticDropdown({
						displayName: 'Resolution',
						required: true,
						options: {
							options: [
								{ label: 'HD Landscape (1280x720)', value: '1280:720' },
								{ label: 'HD Portrait (720x1280)', value: '720:1280' },
								{ label: 'Wide (1104x832)', value: '1104:832' },
								{ label: 'Tall (832x1104)', value: '832:1104' },
								{ label: 'Square (960x960)', value: '960:960' },
								{ label: 'Ultra Wide (1584x672)', value: '1584:672' },
							],
						},
					});
				} else if ((model as unknown as string) === 'gen3a_turbo') {
					ratioOptions['ratio'] = Property.StaticDropdown({
						displayName: 'Resolution',
						required: true,
						options: {
							options: [
								{ label: 'Landscape (1280x768)', value: '1280:768' },
								{ label: 'Portrait (768x1280)', value: '768:1280' },
							],
						},
					});
				} else if ((model as unknown as string) === 'veo3') {
					ratioOptions['ratio'] = Property.StaticDropdown({
						displayName: 'Resolution',
						required: true,
						options: {
							options: [
								{ label: 'HD Landscape (1280x720)', value: '1280:720' },
								{ label: 'HD Portrait (720x1280)', value: '720:1280' },
							],
						},
					});
				} else {
					ratioOptions['ratio'] = Property.StaticDropdown({
						displayName: 'Resolution',
						required: true,
						options: {
							options: [
								{ label: 'Select a model first', value: '' },
							],
						},
					});
				}
				
				return ratioOptions;
			},
		}),
		duration: Property.DynamicProperties({
			displayName: 'Video Duration',
			description: 'Available durations depend on the selected model',
			required: true,
			refreshers: ['model'],
			props: async ({ model }) => {
				const durationOptions: DynamicPropsValue = {};
				
				if ((model as unknown as string) === 'veo3') {
					durationOptions['duration'] = Property.StaticDropdown({
						displayName: 'Duration (seconds)',
						required: true,
						defaultValue: 8,
						options: {
							options: [
								{ label: '8 seconds (required for veo3)', value: 8 },
							],
						},
					});
				} else if ((model as unknown as string) === 'gen4_turbo' || (model as unknown as string) === 'gen3a_turbo') {
					durationOptions['duration'] = Property.StaticDropdown({
						displayName: 'Duration (seconds)',
						required: true,
						options: {
							options: [
								{ label: '5 seconds', value: 5 },
								{ label: '10 seconds', value: 10 },
							],
						},
					});
				} else {
					durationOptions['duration'] = Property.StaticDropdown({
						displayName: 'Duration (seconds)',
						required: true,
						options: {
							options: [
								{ label: 'Select a model first', value: '' },
							],
						},
					});
				}
				
				return durationOptions;
			},
		}),
		seed: Property.Number({ 
			displayName: 'Seed (Optional)', 
			description: 'Random seed for reproducible results (0-4294967295)',
			required: false 
		}),
		contentModeration: Property.DynamicProperties({
			displayName: 'Content Moderation',
			description: 'Content moderation settings (not available for veo3)',
			required: false,
			refreshers: ['model'],
			props: async ({ model }) => {
				const moderationOptions: DynamicPropsValue = {};
				
				if ((model as unknown as string) === 'veo3') {
					moderationOptions['info'] = Property.MarkDown({
						value: '**Note:** Content moderation is not supported by the veo3 model.',
					});
				} else {
					moderationOptions['publicFigureThreshold'] = Property.StaticDropdown({
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
					});
				}
				
				return moderationOptions;
			},
		}),
	},
	async run({ auth, propsValue, files }) {
		// Zod validation
		await propsValidation.validateZod(propsValue, {
			promptText: z.string().max(1000, 'Prompt text must be 1000 characters or fewer').optional(),
			seed: z.number().min(0, 'Seed must be at least 0').max(4294967295, 'Seed must be at most 4294967295').optional(),
			promptImageUrl: z.string().url('Prompt image URL must be a valid HTTPS URL').optional(),
		});

		// Input validation
		const hasFile = !!propsValue.promptImageFile;
		const hasUrl = !!propsValue.promptImageUrl;
		
		if ((hasFile && hasUrl) || (!hasFile && !hasUrl)) {
			throw new Error('You must provide either a Prompt Image File or a Prompt Image URL, but not both.');
		}

		// Model-specific validations
		const model = propsValue.model;
		const duration = (propsValue.duration as any)?.['duration'] || propsValue.duration;
		const ratio = (propsValue.ratio as any)?.['ratio'] || propsValue.ratio;
		const imagePosition = propsValue.imagePosition || 'first';
		
		// Validate duration per model
		if (model === 'veo3' && duration !== 8) {
			throw new Error('veo3 model requires a duration of exactly 8 seconds');
		}
		if ((model === 'gen4_turbo' || model === 'gen3a_turbo') && duration !== 5 && duration !== 10) {
			throw new Error(`${model} model requires a duration of either 5 or 10 seconds`);
		}

		// Validate ratio per model
		const validRatios = {
			gen4_turbo: ['1280:720', '720:1280', '1104:832', '832:1104', '960:960', '1584:672'],
			gen3a_turbo: ['1280:768', '768:1280'],
			veo3: ['1280:720', '720:1280']
		};
		
		if (!validRatios[model as keyof typeof validRatios]?.includes(ratio)) {
			throw new Error(`Invalid resolution ${ratio} for model ${model}`);
		}

		// Validate image position per model
		if (imagePosition === 'last' && model !== 'gen3a_turbo') {
			throw new Error('Last frame positioning is only supported by gen3a_turbo model');
		}

		// Prepare image URL
		let imageUrl: string;
		if (hasFile) {
			const f = propsValue.promptImageFile as any;
			const ext = f?.extension || 'jpeg';
			imageUrl = `data:image/${ext};base64,${f?.base64}`;
		} else {
			imageUrl = propsValue.promptImageUrl as string;
		}

		const apiKey = auth as string;
		const client = new RunwayML({ apiKey });

		// Build request body according to SDK specification
		const requestBody: any = {
			model: model,
			ratio: ratio,
		};

		// Handle different image input formats based on position
		if (imagePosition === 'first' || model !== 'gen3a_turbo') {
			// Simple string format for first frame or non-gen3a_turbo models
			requestBody.promptImage = imageUrl;
		} else {
			// Array format for last frame positioning (gen3a_turbo only)
			requestBody.promptImage = [{
				uri: imageUrl,
				position: imagePosition
			}];
		}

		// Add optional parameters
		if (duration) {
			requestBody.duration = duration;
		}

		if (propsValue.promptText) {
			requestBody.promptText = propsValue.promptText;
		}

		if (propsValue.seed !== undefined) {
			requestBody.seed = propsValue.seed;
		}

		// Add content moderation only for supported models
		if (model !== 'veo3' && (propsValue.contentModeration as any)?.['publicFigureThreshold']) {
			requestBody.contentModeration = {
				publicFigureThreshold: (propsValue.contentModeration as any)['publicFigureThreshold']
			};
		}

		try {
			const task = await client.imageToVideo.create(requestBody);
			
			return {
				success: true,
				taskId: task.id,
			};
		} catch (error: any) {
			throw new Error(`Failed to generate video: ${error.message || 'Unknown error'}`);
		}
	},
});


