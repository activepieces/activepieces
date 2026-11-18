import { createAction, Property } from '@activepieces/pieces-framework';

import { robollyAuth } from '../../auth';
import { robollyApi } from '../../common/api';
import { robollyListGalleryTemplatesOutputSchema } from '../../output-schemas';

export const listGalleryTemplatesAction = createAction({
	auth: robollyAuth,
	name: 'robolly_list_gallery_templates',
	outputSchema: robollyListGalleryTemplatesOutputSchema,
	displayName: 'List Gallery Templates',
	description: "Lists Robolly's pre-built gallery templates.",
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists Robolly's pre-built gallery templates. These are designs offered by Robolly, not templates in the account; use List Templates for the account's own templates, which are the ones Render Template accepts. Pass paginationCursorNext from the previous page as the cursor to get the next page.",
		idempotent: true,
	},
	props: {
		cursor: Property.ShortText({
			displayName: 'Cursor',
			description: 'paginationCursorNext from the previous page.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await robollyApi.listGalleryTemplates({ auth, cursor: propsValue.cursor });
	},
});
