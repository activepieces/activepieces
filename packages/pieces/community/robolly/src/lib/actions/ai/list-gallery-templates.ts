import { createAction } from '@activepieces/pieces-framework';

import { robollyAuth } from '../../auth';
import { robollyApi } from '../../common/api';

export const listGalleryTemplatesAction = createAction({
	auth: robollyAuth,
	name: 'robolly_list_gallery_templates',
	displayName: 'List Gallery Templates',
	description: "Lists Robolly's pre-built gallery templates.",
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists Robolly's pre-built gallery templates. These are designs offered by Robolly, not templates in the account; use List Templates for the account's own templates, which are the ones Render Template accepts.",
		idempotent: true,
	},
	props: {},
	async run({ auth }) {
		return await robollyApi.listGalleryTemplates({ auth });
	},
});
