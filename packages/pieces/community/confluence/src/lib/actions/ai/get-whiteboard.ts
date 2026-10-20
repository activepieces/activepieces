import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceCreateFolderOutputSchema } from '../../output-schemas';

export const getWhiteboardAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_whiteboard',
	outputSchema: confluenceCreateFolderOutputSchema,
	displayName: 'Get Whiteboard',
	description: 'Gets a whiteboard by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one Confluence whiteboard by ID, with its title, space, parent, owner and version.',
		idempotent: true,
	},
	props: {
		whiteboardId: Property.ShortText({
			displayName: 'Whiteboard ID',
			description: 'Numeric whiteboard ID, from Create Whiteboard or List Child Content.',
			required: true,
		}),
	},
	async run(context) {
		return await confluenceApi.getContent({
			auth: context.auth,
			contentType: 'whiteboards',
			contentId: context.propsValue.whiteboardId,
		});
	},
});
