import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { runwayAuth, runwayRequest, runwayModelProperty } from '../common';

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
		model: runwayModelProperty,
		promptText: Property.LongText({ displayName: 'Prompt', required: true }),
		ratio: Property.StaticDropdown({
			displayName: 'Ratio',
			required: false,
			options: {
				options: [
					{ label: '1:1', value: '1:1' },
					{ label: '16:9', value: '16:9' },
					{ label: '9:16', value: '9:16' },
					{ label: '4:3', value: '4:3' },
				],
			},
		}),
		seed: Property.Number({ displayName: 'Seed', required: false }),
		references: Property.Array({
			displayName: 'Reference Image URLs',
			required: false,
			properties: { url: Property.ShortText({ displayName: 'URL', required: true }) },
		}),
	},
	async run({ auth, propsValue }) {
		const apiKey = auth as string;
		const body: Record<string, unknown> = {
			model: propsValue.model,
			prompt: propsValue.promptText,
			...('ratio' in propsValue && propsValue.ratio ? { ratio: propsValue.ratio } : {}),
			...('seed' in propsValue && propsValue.seed ? { seed: Number(propsValue.seed) } : {}),
			...('references' in propsValue && propsValue.references
				? { references: (propsValue.references as Array<{ url: string }>).map((r) => r.url) }
				: {}),
		};
		const data = await runwayRequest<TextToImageResponse>({
			apiKey,
			method: HttpMethod.POST,
			resource: '/v1/text_to_image',
			body,
			versionHeader: '2024-06-01',
		});
		return { taskId: data.id, status: data.status, createdAt: data.created_at, metadata: data.metadata };
	},
});


