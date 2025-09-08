import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { runwayAuth, runwayRequest } from '../common';

type TextToImageResponse = {
	id: string;
	status?: string;
	created_at?: string;
	metadata?: Record<string, unknown>;
};

export const generateImageFromText = createAction({
	auth: runwayAuth,
	name: 'generate_image_from_text',
	displayName: 'Generate Image From Text',
	description: 'Create a text-to-image generation task',
	props: {
		model: Property.StaticDropdown({
			displayName: 'Model',
			required: true,
			options: {
				options: [
					{ label: 'gen4_image', value: 'gen4_image' },
					{ label: 'gen4_image_turbo', value: 'gen4_image_turbo' },
				],
			},
		}),
		promptText: Property.LongText({ displayName: 'Prompt', required: true }),
		ratio: Property.StaticDropdown({
			displayName: 'Ratio',
			required: true,
			options: {
				options: [
					{ label: '1920:1080', value: '1920:1080' },
					{ label: '1080:1920', value: '1080:1920' },
					{ label: '1024:1024', value: '1024:1024' },
					{ label: '1360:768', value: '1360:768' },
					{ label: '1080:1080', value: '1080:1080' },
					{ label: '1168:880', value: '1168:880' },
					{ label: '1440:1080', value: '1440:1080' },
					{ label: '1080:1440', value: '1080:1440' },
					{ label: '1808:768', value: '1808:768' },
					{ label: '2112:912', value: '2112:912' },
					{ label: '1280:720', value: '1280:720' },
					{ label: '720:1280', value: '720:1280' },
					{ label: '720:720', value: '720:720' },
					{ label: '960:720', value: '960:720' },
					{ label: '720:960', value: '720:960' },
					{ label: '1680:720', value: '1680:720' },
				],
			},
		}),
		seed: Property.Number({ displayName: 'Seed', required: false }),
		referenceImages: Property.Array({
			displayName: 'Reference Images',
			required: false,
			properties: {
				uri: Property.ShortText({ displayName: 'Image URI', required: true }),
				tag: Property.ShortText({ displayName: 'Tag', required: false }),
			},
		}),
		contentModerationPublicFigureThreshold: Property.StaticDropdown({
			displayName: 'Content Moderation: Public Figure Threshold',
			required: false,
			options: {
				options: [
					{ label: 'auto', value: 'auto' },
					{ label: 'low', value: 'low' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const apiKey = auth as string;
		const body: Record<string, unknown> = {
			model: propsValue.model,
			promptText: propsValue.promptText,
			ratio: propsValue.ratio,
			...('seed' in propsValue && propsValue.seed ? { seed: Number(propsValue.seed) } : {}),
			...('referenceImages' in propsValue && propsValue.referenceImages
				? { referenceImages: propsValue.referenceImages }
				: {}),
			...('contentModerationPublicFigureThreshold' in propsValue && propsValue.contentModerationPublicFigureThreshold
				? { contentModeration: { publicFigureThreshold: propsValue.contentModerationPublicFigureThreshold } }
				: {}),
		};
		const data = await runwayRequest<TextToImageResponse>({
			apiKey,
			method: HttpMethod.POST,
			resource: '/v1/text_to_image',
			body,
		});
		return { taskId: data.id, status: data.status, createdAt: data.created_at, metadata: data.metadata };
	},
});


