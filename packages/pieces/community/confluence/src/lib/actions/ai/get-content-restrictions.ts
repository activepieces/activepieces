import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceGetContentRestrictionsOutputSchema } from '../../output-schemas';

export const getContentRestrictionsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_content_restrictions',
	outputSchema: confluenceGetContentRestrictionsOutputSchema,
	displayName: 'Get Content Restrictions',
	description: 'Gets who may view or edit a page or blog post.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the read and update restrictions on a Confluence page or blog post, including the users and groups each one allows. Empty restrictions mean the space permissions apply.',
		idempotent: true,
	},
	props: {
		contentId: confluenceAiProps.pageId({
			required: true,
			displayName: 'Content ID',
			description: 'Numeric ID of the page or blog post, from List Pages or List Blog Posts.',
		}),
	},
	async run(context) {
		return await confluenceApi.getContentRestrictions({
			auth: context.auth,
			contentId: context.propsValue.contentId,
			query: { expand: 'restrictions.user,restrictions.group' },
		});
	},
});
