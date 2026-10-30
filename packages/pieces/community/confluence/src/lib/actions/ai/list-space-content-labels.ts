import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListAttachmentLabelsOutputSchema } from '../../output-schemas';

export const listSpaceContentLabelsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_space_content_labels',
	outputSchema: confluenceListAttachmentLabelsOutputSchema,
	displayName: 'List Space Content Labels',
	description: 'Lists the labels used on content in a space.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the labels used on pages, blog posts and other content inside a Confluence space. Use List Space Labels for labels on the space itself. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		spaceId: confluenceAiProps.spaceId({ required: true }),
		prefix: Property.StaticDropdown({
			displayName: 'Prefix',
			description: 'Only labels with this prefix.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'My (personal)', value: 'my' },
					{ label: 'Team', value: 'team' },
				],
			},
		}),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { spaceId, prefix, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'spaces',
			contentId: spaceId,
			relation: 'content/labels',
			query: { prefix, limit, cursor },
		});
	},
});
