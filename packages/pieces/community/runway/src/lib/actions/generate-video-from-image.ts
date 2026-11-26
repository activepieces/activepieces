import { createAction, MarkdownVariant, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { runwayAuth } from '../common';
import RunwayML from '@runwayml/sdk';
import * as z from 'zod/mini'

export const generateVideoFromImage = createAction({
	auth: runwayAuth,
	name: 'generate_video_from_image',
	classification: 'READ',
	displayName: 'Generate Video From Image',
	description: 'Start a video generation from an image and an optional prompt.',
	audience: 'both',
	aiMetadata: { description: 'Submits an image-to-video generation job to Runway from a starting frame and optional prompt, returning the created task ID; the video is produced asynchronously, so poll Get Task Details with that ID for the result. Provide the starting frame as exactly one of an uploaded file or an HTTPS image URL (not both). Choose when an agent needs to animate an image into a clip. Each call starts a new billable generation, so it is not idempotent.', idempotent: false },
	propertyGroups: [
		{ key: 'model', display: 'section', label: 'Model', icon: 'sliders', props: ['model', 'ratio', 'duration'] },
		{ key: 'image', display: 'section', label: 'Starting Image', icon: 'file', props: ['imageSourceInfo', 'promptImageFile', 'promptImageUrl', 'imagePosition'] },
	],
	props: {
		model: Property.StaticDropdown({
			displayName: 'Model',
			required: true,
			display: 'cards',
			options: {
				options: [
					{ label: 'Gen4 Turbo', value: 'gen4_turbo', description: 'Fast' },
					{ label: 'Gen3a Turbo', value: 'gen3a_turbo', description: 'Balanced' },
					{ label: 'Veo3', value: 'veo3', description: 'By Google' },
				],
			},
		}),
		ratio: Property.DynamicProperties({
			auth: runwayAuth,
			displayName: 'Resolution',
			description: 'Available resolutions depend on the selected model',
			required: true,
			refreshers: ['model'],
			props: async ({ model }) => {
				const ratioOptions: DynamicPropsValue = {};

				if ((model as unknown as string) === 'gen4_turbo') {
					ratioOptions['ratio'] = Property.StaticDropdown({
						displayName: 'Resolution',
						description: 'Width and height of the video.',
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
						description: 'Width and height of the video.',
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
						description: 'Width and height of the video.',
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
						description: 'Width and height of the video.',
						required: true,
						options: {
							options: [],
							placeholder: 'Pick a model first',
						},
					});
				}

				return ratioOptions;
			},
		}),
		duration: Property.DynamicProperties({
			auth: runwayAuth,
			displayName: 'Duration',
			description: 'Available durations depend on the selected model',
			required: true,
			refreshers: ['model'],
			props: async ({ model }) => {
				const durationOptions: DynamicPropsValue = {};

				if ((model as unknown as string) === 'veo3') {
					durationOptions['duration'] = Property.StaticDropdown({
						displayName: 'Duration',
						description: 'Veo3 videos are always 8 seconds.',
						required: true,
						defaultValue: 8,
						options: {
							options: [
								{ label: '8 seconds', value: 8 },
							],
						},
					});
				} else if ((model as unknown as string) === 'gen4_turbo' || (model as unknown as string) === 'gen3a_turbo') {
					durationOptions['duration'] = Property.StaticDropdown({
						displayName: 'Duration',
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
						displayName: 'Duration',
						required: true,
						options: {
							options: [],
							placeholder: 'Pick a model first',
						},
					});
				}

				return durationOptions;
			},
		}),
		imageSourceInfo: Property.MarkDown({
			value: 'Upload an image file or enter an image URL, not both.',
			variant: MarkdownVariant.INFO,
		}),
		promptImageFile: Property.File({
			displayName: 'Image File',
			description: 'The image the video starts from.',
			required: false
		}),
		promptImageUrl: Property.ShortText({
			displayName: 'Image URL',
			description: 'Public HTTPS link to the image, used instead of a file.',
			placeholder: 'https://example.com/frame.jpg',
			required: false
		}),
		imagePosition: Property.StaticDropdown({
			displayName: 'Image Position',
			description: 'Where the image sits in the video. Last frame needs Gen3a Turbo.',
			required: false,
			defaultValue: 'first',
			options: {
				options: [
					{ label: 'First Frame', value: 'first' },
					{ label: 'Last Frame', value: 'last' },
				],
			},
		}),
		promptText: Property.LongText({
			displayName: 'Prompt',
			description: 'What should happen in the video. Up to 1,000 characters.',
			required: false
		}),
		seed: Property.Number({
			displayName: 'Seed',
			description: 'Use the same seed and prompt to get the same result.',
			required: false,
			advanced: true,
		}),
		contentModeration: Property.DynamicProperties({
			auth: runwayAuth,
			displayName: 'Content Moderation',
			description: 'Content moderation settings (not available for veo3)',
			required: false,
			advanced: true,
			refreshers: ['model'],
			props: async ({ model }) => {
				const moderationOptions: DynamicPropsValue = {};

				if ((model as unknown as string) === 'veo3') {
					moderationOptions['info'] = Property.MarkDown({
						value: 'Veo3 does not support content moderation.',
						variant: MarkdownVariant.INFO,
					});
				} else {
					moderationOptions['publicFigureThreshold'] = Property.StaticDropdown({
						displayName: 'Public Figure Detection',
						description: 'How strictly to block images of recognizable public figures.',
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
			promptText: z.optional(z.string().check(z.maxLength(1000, 'Prompt text must be 1000 characters or fewer'))),
			seed: z.optional(z.number().check(z.minimum(0, 'Seed must be at least 0'), z.maximum(4294967295, 'Seed must be at most 4294967295'))),
			promptImageUrl: z.optional(z.string().check(z.url('Prompt image URL must be a valid HTTPS URL'))),
		});

		// Input validation
		const hasFile = !!propsValue.promptImageFile;
		const hasUrl = !!propsValue.promptImageUrl;

		if ((hasFile && hasUrl) || (!hasFile && !hasUrl)) {
			throw new Error('Provide either an Image File or an Image URL, not both.');
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

		const apiKey = auth.secret_text;
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


