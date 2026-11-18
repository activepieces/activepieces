import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListPagesForLabelOutputSchema } from '../../output-schemas';

export const listPagesForLabelAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_pages_for_label',
	outputSchema: confluenceListPagesForLabelOutputSchema,
	displayName: 'List Pages for Label',
	description: 'Lists the pages that carry a label.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the Confluence pages that carry a label, optionally limited to a space. Get the numeric label ID from Get Label or List Labels. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		labelId: Property.ShortText({
			displayName: 'Label ID',
			description: 'Numeric label ID, from Get Label or List Labels.',
			required: true,
		}),
		spaceId: confluenceAiProps.spaceId({
			required: false,
			description: 'Only content in this space. Numeric space ID from List Spaces.',
		}),
		bodyFormat: confluenceAiProps.readBodyFormat({ required: false }),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Newest first', value: '-created-date' },
					{ label: 'Oldest first', value: 'created-date' },
					{ label: 'Recently modified first', value: '-modified-date' },
				],
			},
		}),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { labelId, spaceId, bodyFormat, sort, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'labels',
			contentId: labelId,
			relation: 'pages',
			query: { 'space-id': spaceId, 'body-format': bodyFormat, sort, limit, cursor },
		});
	},
});
