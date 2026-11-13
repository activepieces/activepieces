import { createAction, Property } from '@activepieces/pieces-framework';

import { imageRouterAuth } from '../../auth';
import { imageRouterApi } from '../../common/api';
import { imageRouterListModelsOutputSchema } from '../../output-schemas';

const OUTPUT_MODALITIES = ['image', 'video', 'text'];
const INPUT_MODALITIES = ['image', 'mask', 'text', 'audio', 'video'];
const SORTS = ['name', 'provider', 'price', 'date'];
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

export const listModelsAction = createAction({
	auth: imageRouterAuth,
	name: 'image_router_list_models',
	outputSchema: imageRouterListModelsOutputSchema,
	displayName: 'List Models',
	description: 'Lists ImageRouter models with their modalities, parameters and pricing.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists ImageRouter models, filtered by output modality (image, video, text), input modality (e.g. image for editing models, mask for inpainting), provider, free or paid, and name or alias, with each model id, modalities, supported parameters, allowed sizes and durations, and pricing. Use it to pick the model id for Generate Image, Edit Image, Generate Video, Create Chat Completion or Create Response. Returns at most limit models (default 50, max 500) with no paging, so narrow with filters. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		outputModality: Property.StaticDropdown({
			displayName: 'Output Modality',
			description: 'Only models producing this: image, video or text.',
			required: false,
			options: { options: OUTPUT_MODALITIES.map((value) => ({ label: value, value })) },
		}),
		inputModality: Property.StaticDropdown({
			displayName: 'Input Modality',
			description:
				'Only models accepting this input, e.g. image for editing or image-to-video models, mask for inpainting.',
			required: false,
			options: { options: INPUT_MODALITIES.map((value) => ({ label: value, value })) },
		}),
		provider: Property.ShortText({
			displayName: 'Provider',
			description: 'Provider name, partial and case-insensitive, e.g. "google" or "openai".',
			required: false,
		}),
		free: Property.StaticDropdown({
			displayName: 'Free',
			description: 'Yes for free models only, No for paid models only. Leave empty for both.',
			required: false,
			options: {
				options: [
					{ label: 'Yes', value: 'true' },
					{ label: 'No', value: 'false' },
				],
			},
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Model name or alias, partial and case-insensitive, e.g. "flux".',
			required: false,
		}),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			description: 'Sort by name, provider, price or date (release date).',
			required: false,
			options: { options: SORTS.map((value) => ({ label: value, value })) },
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: `Maximum models to return, 1 to ${MAX_LIMIT}. Defaults to ${DEFAULT_LIMIT}.`,
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const limit = propsValue.limit ?? DEFAULT_LIMIT;
		if (limit < 1 || limit > MAX_LIMIT) {
			throw new Error(`limit must be from 1 to ${MAX_LIMIT}.`);
		}
		const models = await imageRouterApi.listModels({
			auth,
			query: {
				output_modalities: propsValue.outputModality,
				input_modalities: propsValue.inputModality,
				provider: propsValue.provider,
				free: propsValue.free,
				name: propsValue.name,
				sort: propsValue.sort,
				limit: String(limit),
			},
		});
		return { models, count: models.length };
	},
});
