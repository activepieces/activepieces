import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceUpdatePageTitleOutputSchema } from '../../output-schemas';

export const updatePageTitleAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_update_page_title',
	outputSchema: confluenceUpdatePageTitleOutputSchema,
	displayName: 'Update Page Title',
	description: 'Renames a page.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the title of a Confluence page, leaving its body untouched. Use Update Page to change the body or status too. Idempotent: setting the same title again leaves the page unchanged.',
		idempotent: true,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'New page title.',
			required: true,
		}),
		status: confluenceAiProps.contentStatus({
			required: false,
			description: 'Whether the page is published (current) or a draft. Defaults to current.',
		}),
	},
	async run(context) {
		const { pageId, title, status } = context.propsValue;
		return await confluenceApi.updatePageTitle({
			auth: context.auth,
			pageId,
			title,
			status: status ?? 'current',
		});
	},
});
