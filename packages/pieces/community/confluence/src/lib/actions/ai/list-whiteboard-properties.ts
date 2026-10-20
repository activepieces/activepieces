import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListWhiteboardPropertiesOutputSchema } from '../../output-schemas';

export const listWhiteboardPropertiesAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_whiteboard_properties',
	outputSchema: confluenceListWhiteboardPropertiesOutputSchema,
	displayName: 'List Whiteboard Properties',
	description: 'Lists the content properties stored on a whiteboard.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the content properties (key/value JSON metadata) stored on a Confluence whiteboard, optionally filtered by key. Each result has the property ID and version that Update Whiteboard Property needs. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		whiteboardId: Property.ShortText({
			displayName: 'Whiteboard ID',
			description: 'Numeric whiteboard ID, from Create Whiteboard or List Child Content.',
			required: true,
		}),
		key: confluenceAiProps.propertyKey({
			required: false,
			description: 'Only the property with this key.',
		}),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { whiteboardId, key, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'whiteboards',
			contentId: whiteboardId,
			relation: 'properties',
			query: { key, limit, cursor },
		});
	},
});
