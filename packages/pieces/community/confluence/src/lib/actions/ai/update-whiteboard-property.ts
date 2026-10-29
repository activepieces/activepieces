import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceUpdateWhiteboardPropertyOutputSchema } from '../../output-schemas';

export const updateWhiteboardPropertyAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_update_whiteboard_property',
	outputSchema: confluenceUpdateWhiteboardPropertyOutputSchema,
	displayName: 'Update Whiteboard Property',
	description: 'Replaces the value of a content property on a whiteboard.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Replaces the JSON value of an existing content property on a Confluence whiteboard, saving it as the next version; the key is kept unless you set a new one. Get the property ID from List Whiteboard Properties. Idempotent: setting the same value again leaves it unchanged.',
		idempotent: true,
	},
	props: {
		whiteboardId: Property.ShortText({
			displayName: 'Whiteboard ID',
			description: 'Numeric whiteboard ID, from Create Whiteboard or List Child Content.',
			required: true,
		}),
		propertyId: confluenceAiProps.propertyId({ required: true }),
		value: confluenceAiProps.propertyValue({
			required: true,
			description: 'New JSON object or array; replaces the current value.',
		}),
		key: confluenceAiProps.propertyKey({
			required: false,
			description: 'New key. Leave empty to keep the current key.',
		}),
	},
	async run(context) {
		const { whiteboardId, propertyId, value, key } = context.propsValue;
		const current = await confluenceApi.getContentProperty({
			auth: context.auth,
			contentType: 'whiteboards',
			contentId: whiteboardId,
			propertyId,
		});
		return await confluenceApi.updateContentProperty({
			auth: context.auth,
			contentType: 'whiteboards',
			contentId: whiteboardId,
			propertyId,
			key: key ?? current.key,
			value,
			versionNumber: current.version.number + 1,
		});
	},
});
