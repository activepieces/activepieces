import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceCreateWhiteboardPropertyOutputSchema } from '../../output-schemas';

export const createWhiteboardPropertyAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_create_whiteboard_property',
	outputSchema: confluenceCreateWhiteboardPropertyOutputSchema,
	displayName: 'Create Whiteboard Property',
	description: 'Stores a new content property on a whiteboard.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Stores a new content property (a key with a JSON value) on a Confluence whiteboard. Fails if the key already exists there; use Update Whiteboard Property to change it. Not idempotent.',
		idempotent: false,
	},
	props: {
		whiteboardId: Property.ShortText({
			displayName: 'Whiteboard ID',
			description: 'Numeric whiteboard ID, from Create Whiteboard or List Child Content.',
			required: true,
		}),
		key: confluenceAiProps.propertyKey({ required: true }),
		value: confluenceAiProps.propertyValue({ required: true }),
	},
	async run(context) {
		const { whiteboardId, key, value } = context.propsValue;
		return await confluenceApi.createContentProperty({
			auth: context.auth,
			contentType: 'whiteboards',
			contentId: whiteboardId,
			key,
			value,
		});
	},
});
