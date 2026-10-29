import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceRemoveLabelOutputSchema } from '../../output-schemas';

export const removeLabelAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_remove_label',
	outputSchema: confluenceRemoveLabelOutputSchema,
	displayName: 'Remove Label',
	description: 'Removes a label from a page, blog post or attachment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Removes one label by name from a Confluence page, blog post or attachment. Fails if the label is not on that content.',
		idempotent: false,
	},
	props: {
		contentId: Property.ShortText({
			displayName: 'Content ID',
			description:
				'ID of the page, blog post or attachment, from List Pages, List Blog Posts or List Page Attachments.',
			required: true,
		}),
		label: Property.ShortText({
			displayName: 'Label',
			description: 'Name of the label to remove.',
			required: true,
		}),
	},
	async run(context) {
		const { contentId, label } = context.propsValue;
		await confluenceApi.removeLabel({ auth: context.auth, pageId: contentId, label });
		return { removed: true, contentId, label };
	},
});
