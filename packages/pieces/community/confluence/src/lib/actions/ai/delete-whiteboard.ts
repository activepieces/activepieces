import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceDeleteWhiteboardOutputSchema } from '../../output-schemas';

export const deleteWhiteboardAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_delete_whiteboard',
	outputSchema: confluenceDeleteWhiteboardOutputSchema,
	displayName: 'Delete Whiteboard',
	description: 'Moves a whiteboard to the trash.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes a Confluence whiteboard by ID, moving it to the trash. Not idempotent: deleting again returns an error.',
		idempotent: false,
	},
	props: {
		whiteboardId: Property.ShortText({
			displayName: 'Whiteboard ID',
			description: 'Numeric whiteboard ID, from Create Whiteboard or List Child Content.',
			required: true,
		}),
	},
	async run(context) {
		const { whiteboardId } = context.propsValue;
		await confluenceApi.deleteContent({
			auth: context.auth,
			contentType: 'whiteboards',
			contentId: whiteboardId,
		});
		return { deleted: true, whiteboardId };
	},
});
