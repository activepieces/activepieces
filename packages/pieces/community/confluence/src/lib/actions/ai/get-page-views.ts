import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceGetPageViewersOutputSchema } from '../../output-schemas';

export const getPageViewsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_page_views',
	outputSchema: confluenceGetPageViewersOutputSchema,
	displayName: 'Get Page Views',
	description: 'Gets the number of total views of a page or blog post.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the number of total views of a Confluence page or blog post, optionally counted from a start date. Needs a paid plan with analytics.',
		idempotent: true,
	},
	props: {
		contentId: confluenceAiProps.pageId({
			required: true,
			displayName: 'Content ID',
			description: 'Numeric ID of the page or blog post, from List Pages or List Blog Posts.',
		}),
		fromDate: Property.ShortText({
			displayName: 'From Date',
			description:
				'Count from this date, in ISO 8601 format (e.g. 2026-01-01). Leave empty for all time.',
			required: false,
		}),
	},
	async run(context) {
		const { contentId, fromDate } = context.propsValue;
		return await confluenceApi.getContentViews({ auth: context.auth, contentId, fromDate });
	},
});
