import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListAttachmentLabelsOutputSchema } from '../../output-schemas';

export const listPageLabelsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_page_labels',
	outputSchema: confluenceListAttachmentLabelsOutputSchema,
	displayName: 'List Page Labels',
	description: 'Lists the labels on a page.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the labels on a Confluence page, optionally filtered by prefix. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
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
		const { pageId, prefix, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'pages',
			contentId: pageId,
			relation: 'labels',
			query: { prefix, limit, cursor },
		});
	},
});
