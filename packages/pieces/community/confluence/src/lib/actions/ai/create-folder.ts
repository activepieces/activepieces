import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceCreateFolderOutputSchema } from '../../output-schemas';

export const createFolderAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_create_folder',
	outputSchema: confluenceCreateFolderOutputSchema,
	displayName: 'Create Folder',
	description: 'Creates a folder in a space.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a Confluence folder in a space, optionally under a parent page or folder, to group pages. Not idempotent: each call creates another folder.',
		idempotent: false,
	},
	props: {
		spaceId: confluenceAiProps.spaceId({ required: true }),
		title: Property.ShortText({ displayName: 'Title', required: false }),
		parentId: Property.ShortText({
			displayName: 'Parent ID',
			description:
				'ID of the page, folder or whiteboard to create it under. Leave empty for the space root.',
			required: false,
		}),
	},
	async run(context) {
		const { spaceId, title, parentId } = context.propsValue;
		return await confluenceApi.createFolder({ auth: context.auth, spaceId, title, parentId });
	},
});
