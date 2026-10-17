import { createAction, Property } from '@activepieces/pieces-framework';

import { runwareAuth } from '../../auth';
import { runwareApi } from '../../common/api';
import { runwareSearchModelsOutputSchema } from '../../output-schemas';

export const searchModelsAction = createAction({
	auth: runwareAuth,
	name: 'runware_search_models',
	outputSchema: runwareSearchModelsOutputSchema,
	displayName: 'Search Models',
	description: 'Searches the Runware model catalog.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Searches Runware models by name, description or AIR ID, with optional filters, and returns matching models with their AIR IDs (the Model value every generation action needs), category, architecture and capabilities, plus the total match count. Page with Limit and Offset.',
		idempotent: true,
	},
	props: {
		search: Property.ShortText({
			displayName: 'Search',
			description: 'Text to match in the model name, description or AIR ID, up to 48 characters.',
			required: false,
		}),
		source: Property.StaticDropdown({
			displayName: 'Source',
			description: 'Only official or only community models.',
			required: false,
			options: {
				options: [
					{ label: 'Official', value: 'official' },
					{ label: 'Community', value: 'community' },
				],
			},
		}),
		category: Property.StaticDropdown({
			displayName: 'Category',
			description: 'Model category.',
			required: false,
			options: {
				options: ['checkpoint', 'lora', 'lycoris', 'vae', 'embeddings'].map((value) => ({
					label: value,
					value,
				})),
			},
		}),
		architecture: Property.ShortText({
			displayName: 'Architecture',
			description: 'Model architecture, e.g. "flux1d" or "sdxl".',
			required: false,
		}),
		capabilities: Property.Array({
			displayName: 'Capabilities',
			description: 'Only models with all of these capabilities, e.g. ["text-to-image"].',
			required: false,
		}),
		visibility: Property.StaticDropdown({
			displayName: 'Visibility',
			description: 'public, private, favorite or owned.',
			required: false,
			options: {
				options: ['public', 'private', 'favorite', 'owned'].map((value) => ({
					label: value,
					value,
				})),
			},
		}),
		sort: Property.ShortText({
			displayName: 'Sort',
			description:
				'One of _score, popularity, -popularity, name, -name, addedUnixTimestamp, -addedUnixTimestamp, updatedDateUnixTimestamp, -updatedDateUnixTimestamp.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Results per page, 1-100. Defaults to 20.',
			required: false,
		}),
		offset: Property.Number({
			displayName: 'Offset',
			description: 'Results to skip, for paging. Defaults to 0.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await runwareApi.runTask({
			auth,
			task: { taskType: 'modelSearch', ...propsValue },
		});
	},
});
