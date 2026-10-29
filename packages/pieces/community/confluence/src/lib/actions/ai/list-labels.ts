import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListAttachmentLabelsOutputSchema } from '../../output-schemas';

export const listLabelsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_labels',
	outputSchema: confluenceListAttachmentLabelsOutputSchema,
	displayName: 'List Labels',
	description: 'Lists the labels used on the site.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists labels on the Confluence site with their IDs, optionally filtered by prefix. Use Get Label to look one up by name, and the label ID with List Pages for Label. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		prefix: Property.StaticDropdown({
			displayName: 'Prefix',
			description: 'Only labels with this prefix.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Global', value: 'global' },
					{ label: 'My (personal)', value: 'my' },
					{ label: 'Team', value: 'team' },
					{ label: 'System', value: 'system' },
				],
			},
		}),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { prefix, limit, cursor } = context.propsValue;
		return await confluenceApi.listLabelsPage({
			auth: context.auth,
			query: { prefix, limit, cursor },
		});
	},
});
