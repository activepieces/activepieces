import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListChildPagesOutputSchema } from '../../output-schemas';

export const listFolderChildrenAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_folder_children',
	outputSchema: confluenceListChildPagesOutputSchema,
	displayName: 'List Folder Children',
	description: 'Lists the direct children of a folder.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the direct children of a Confluence folder: pages, folders, whiteboards and other content, each with its type. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		folderId: Property.ShortText({
			displayName: 'Folder ID',
			description: 'Numeric folder ID, from Create Folder or List Child Content.',
			required: true,
		}),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { folderId, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'folders',
			contentId: folderId,
			relation: 'direct-children',
			query: { limit, cursor },
		});
	},
});
