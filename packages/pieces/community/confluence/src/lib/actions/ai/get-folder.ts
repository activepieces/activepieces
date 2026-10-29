import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceCreateFolderOutputSchema } from '../../output-schemas';

export const getFolderAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_folder',
	outputSchema: confluenceCreateFolderOutputSchema,
	displayName: 'Get Folder',
	description: 'Gets a folder by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one Confluence folder by ID, with its title, space, parent, owner and version.',
		idempotent: true,
	},
	props: {
		folderId: Property.ShortText({
			displayName: 'Folder ID',
			description: 'Numeric folder ID, from Create Folder or List Child Content.',
			required: true,
		}),
	},
	async run(context) {
		return await confluenceApi.getContent({
			auth: context.auth,
			contentType: 'folders',
			contentId: context.propsValue.folderId,
		});
	},
});
