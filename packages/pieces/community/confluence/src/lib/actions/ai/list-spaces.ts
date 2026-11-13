import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListSpacesOutputSchema } from '../../output-schemas';

export const listSpacesAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_spaces',
	outputSchema: confluenceListSpacesOutputSchema,
	displayName: 'List Spaces',
	description: 'Lists spaces, optionally filtered by key, type, status or label.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the Confluence spaces the connected user can see, one page of results at a time, filtered by space keys, type, status or labels. Each result has the numeric space ID other actions need and the space key. Pass nextCursor back as Cursor, with the same filters, to get the next page.',
		idempotent: true,
	},
	props: {
		keys: Property.ShortText({
			displayName: 'Space Keys',
			description: 'Only these space keys, comma-separated, e.g. "DOCS,ENG".',
			required: false,
		}),
		type: Property.StaticDropdown({
			displayName: 'Type',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Global', value: 'global' },
					{ label: 'Collaboration', value: 'collaboration' },
					{ label: 'Knowledge base', value: 'knowledge_base' },
					{ label: 'Personal', value: 'personal' },
				],
			},
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Current', value: 'current' },
					{ label: 'Archived', value: 'archived' },
				],
			},
		}),
		labels: Property.ShortText({
			displayName: 'Labels',
			description: 'Only spaces with these labels, comma-separated.',
			required: false,
		}),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Name A-Z', value: 'name' },
					{ label: 'Name Z-A', value: '-name' },
					{ label: 'Key A-Z', value: 'key' },
				],
			},
		}),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { keys, type, status, labels, sort, limit, cursor } = context.propsValue;
		return await confluenceApi.listSpacesPage({
			auth: context.auth,
			query: { keys, type, status, labels, sort, 'description-format': 'plain', limit, cursor },
		});
	},
});
