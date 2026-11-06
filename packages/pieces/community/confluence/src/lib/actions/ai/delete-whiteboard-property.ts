import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceDeleteBlogPostPropertyOutputSchema } from '../../output-schemas';

export const deleteWhiteboardPropertyAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_delete_whiteboard_property',
	outputSchema: confluenceDeleteBlogPostPropertyOutputSchema,
	displayName: 'Delete Whiteboard Property',
	description: 'Deletes a content property from a whiteboard.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a content property from a Confluence whiteboard. Get the property ID from List Whiteboard Properties. Not idempotent: deleting again returns an error.',
		idempotent: false,
	},
	props: {
		whiteboardId: Property.ShortText({
			displayName: 'Whiteboard ID',
			description: 'Numeric whiteboard ID, from Create Whiteboard or List Child Content.',
			required: true,
		}),
		propertyId: confluenceAiProps.propertyId({ required: true }),
	},
	async run(context) {
		const { whiteboardId, propertyId } = context.propsValue;
		await confluenceApi.deleteContentProperty({
			auth: context.auth,
			contentType: 'whiteboards',
			contentId: whiteboardId,
			propertyId,
		});
		return { deleted: true, propertyId };
	},
});
