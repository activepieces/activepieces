import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { runwayRequest, runwayModelProperty, runwayAuth } from '../common';

type ImageToVideoResponse = { id: string };

export const generateVideoFromImage = createAction({
	auth: runwayAuth,
	name: 'generate_video_from_image',
	displayName: 'Generate Video from Image',
	description: 'Create a video generation task from an image',
	props: {
		model: runwayModelProperty,
		promptImageFile: Property.File({ displayName: 'Prompt Image File', required: false }),
		promptImageUrl: Property.ShortText({ displayName: 'Prompt Image URL', required: false }),
		promptText: Property.LongText({ displayName: 'Prompt Text', required: false }),
		ratio: Property.StaticDropdown({
			displayName: 'Ratio',
			required: true,
			options: { options: [
				{ label: '16:9', value: '16:9' },
				{ label: '9:16', value: '9:16' },
				{ label: '1:1', value: '1:1' },
			] },
		}),
		durationSeconds: Property.Number({ displayName: 'Duration (seconds)', required: true }),
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
			image: imageUrl,
			...('promptText' in propsValue && propsValue.promptText ? { prompt: propsValue.promptText } : {}),
			ratio: propsValue.ratio,
			duration: Number(propsValue.durationSeconds),
		};
		const data = await runwayRequest<ImageToVideoResponse>({
			apiKey,
			method: HttpMethod.POST,
			resource: '/v1/image_to_video',
			body,
			versionHeader: '2024-06-01',
		});
		return { taskId: data.id };
	},
});


