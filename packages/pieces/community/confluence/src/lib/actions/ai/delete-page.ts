import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceDeletePageOutputSchema } from '../../output-schemas';

export const deletePageAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_delete_page',
	outputSchema: confluenceDeletePageOutputSchema,
	displayName: 'Delete Page',
	description: 'Moves a page to the trash, or purges it.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes a Confluence page by ID. By default it moves the page to the trash (recoverable); Purge permanently removes a page that is already in the trash, and Draft deletes an unpublished draft. Not idempotent: deleting again returns an error.',
		idempotent: false,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
		purge: Property.Checkbox({
			displayName: 'Purge',
			description: 'Permanently delete a page that is already in the trash. Cannot be undone.',
			required: false,
		}),
		draft: Property.Checkbox({
			displayName: 'Draft',
			description: 'Delete the unpublished draft of the page.',
			required: false,
		}),
	},
	async run(context) {
		const { pageId, purge, draft } = context.propsValue;
		await confluenceApi.deleteContent({
			auth: context.auth,
			contentType: 'pages',
			contentId: pageId,
			query: { purge: purge || undefined, draft: draft || undefined },
		});
		return { deleted: true, pageId };
	},
});
