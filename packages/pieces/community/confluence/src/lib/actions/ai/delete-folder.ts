import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceDeleteFolderOutputSchema } from '../../output-schemas';

export const deleteFolderAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_delete_folder',
	outputSchema: confluenceDeleteFolderOutputSchema,
	displayName: 'Delete Folder',
	description: 'Moves a folder to the trash.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes a Confluence folder by ID, moving it to the trash. Content inside the folder moves up to its parent. Not idempotent: deleting again returns an error.',
		idempotent: false,
	},
	props: {
		folderId: Property.ShortText({
			displayName: 'Folder ID',
			description: 'Numeric folder ID, from Create Folder or List Child Content.',
			required: true,
		}),
	},
	async run(context) {
		const { folderId } = context.propsValue;
		await confluenceApi.deleteContent({
			auth: context.auth,
			contentType: 'folders',
			contentId: folderId,
		});
		return { deleted: true, folderId };
	},
});
