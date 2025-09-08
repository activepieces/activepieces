import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { runwayRequest, runwayAuth } from '../common';

type ImageToVideoResponse = { id: string };

export const generateVideoFromImage = createAction({
	auth: runwayAuth,
	name: 'generate_video_from_image',
	displayName: 'Generate Video from Image',
	description: 'Create a video generation task from an image',
	props: {
		model: Property.StaticDropdown({
			displayName: 'Model',
			required: true,
			options: {
				options: [
					{ label: 'gen4_turbo', value: 'gen4_turbo' },
					{ label: 'gen3a_turbo', value: 'gen3a_turbo' },
				],
			},
		}),
		promptImageFile: Property.File({ displayName: 'Prompt Image File', required: false }),
		promptImageUrl: Property.ShortText({ displayName: 'Prompt Image URL', required: false }),
		promptText: Property.LongText({ displayName: 'Prompt Text', required: false }),
		ratio: Property.StaticDropdown({
			displayName: 'Ratio',
			required: true,
			options: { options: [
				{ label: '1280:720', value: '1280:720' },
				{ label: '720:1280', value: '720:1280' },
				{ label: '1104:832', value: '1104:832' },
				{ label: '832:1104', value: '832:1104' },
				{ label: '960:960', value: '960:960' },
				{ label: '1584:672', value: '1584:672' },
				{ label: '1280:768', value: '1280:768' },
				{ label: '768:1280', value: '768:1280' },
			] },
		}),
		duration: Property.StaticDropdown({
			displayName: 'Duration (seconds)',
			required: true,
			options: { options: [
				{ label: '5', value: 5 },
				{ label: '10', value: 10 },
			] },
		}),
		seed: Property.Number({ displayName: 'Seed', required: false }),
		contentModerationPublicFigureThreshold: Property.StaticDropdown({
			displayName: 'Content Moderation: Public Figure Threshold',
			required: false,
			options: { options: [
				{ label: 'auto', value: 'auto' },
				{ label: 'low', value: 'low' },
			] },
		}),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = auth as string;
		const hasFile = !!propsValue.promptImageFile;
		const hasUrl = !!propsValue.promptImageUrl;
		if ((hasFile && hasUrl) || (!hasFile && !hasUrl)) {
			throw new Error('Provide either Prompt Image File or Prompt Image URL, not both.');
		}
		let imageUrl: string | undefined = undefined;
		if (hasFile) {
			const f = propsValue.promptImageFile as any;
			const ext = f?.extension || 'jpeg';
			imageUrl = `data:image/${ext};base64,${f?.base64}`;
		} else {
			imageUrl = propsValue.promptImageUrl as string;
		}
		const body: Record<string, unknown> = {
			model: propsValue.model,
			promptImage: imageUrl,
			ratio: propsValue.ratio,
			duration: Number(propsValue.duration),
			...('seed' in propsValue && propsValue.seed ? { seed: Number(propsValue.seed) } : {}),
			...('promptText' in propsValue && propsValue.promptText ? { promptText: propsValue.promptText } : {}),
			...('contentModerationPublicFigureThreshold' in propsValue && propsValue.contentModerationPublicFigureThreshold
				? { contentModeration: { publicFigureThreshold: propsValue.contentModerationPublicFigureThreshold } }
				: {}),
		};
		const data = await runwayRequest<ImageToVideoResponse>({
			apiKey,
			method: HttpMethod.POST,
			resource: '/v1/image_to_video',
			body,
		});
		return { taskId: data.id };
	},
});


