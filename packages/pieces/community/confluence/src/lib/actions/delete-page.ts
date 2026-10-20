import { createAction, Property } from '@activepieces/pieces-framework';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { confluenceProps } from '../common/props';
import { deletePageOutputSchema } from '../output-schemas';

export const deletePageAction = createAction({
	auth: confluenceAuth,
	name: 'delete-page',
	outputSchema: deletePageOutputSchema,
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Page',
	description: 'Trashes or permanently deletes a page.',
	audience: 'human',
	aiMetadata: { description: 'Deletes a Confluence page by ID; by default it is moved to the trash, or when "purge permanently" is enabled it is removed from the trash for good. Use to remove a page. Not idempotent in practice: it mutates page state and re-running after deletion errors rather than returning the same result, and a purge is irreversible.', idempotent: false },
	props: {
		spaceId: confluenceProps.spaceId({ required: true }),
		pageId: confluenceProps.pageId({ required: true }),
		purge: Property.Checkbox({
			displayName: 'Purge Permanently',
			description:
				'If enabled, the page is removed from the trash permanently. Otherwise it is moved to trash.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { pageId, purge } = context.propsValue;

		await confluenceApi.deletePage({ auth: context.auth, pageId, purge });

		return { success: true, pageId };
	},
});
