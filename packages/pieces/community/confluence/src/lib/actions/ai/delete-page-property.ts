import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceDeleteBlogPostPropertyOutputSchema } from '../../output-schemas';

export const deletePagePropertyAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_delete_page_property',
	outputSchema: confluenceDeleteBlogPostPropertyOutputSchema,
	displayName: 'Delete Page Property',
	description: 'Deletes a content property from a page.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a content property from a Confluence page. Get the property ID from List Page Properties. Not idempotent: deleting again returns an error.',
		idempotent: false,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
		propertyId: confluenceAiProps.propertyId({ required: true }),
	},
	async run(context) {
		const { pageId, propertyId } = context.propsValue;
		await confluenceApi.deleteContentProperty({
			auth: context.auth,
			contentType: 'pages',
			contentId: pageId,
			propertyId,
		});
		return { deleted: true, propertyId };
	},
});
