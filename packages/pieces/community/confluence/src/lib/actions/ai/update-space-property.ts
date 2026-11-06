import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceUpdateSpacePropertyOutputSchema } from '../../output-schemas';

export const updateSpacePropertyAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_update_space_property',
	outputSchema: confluenceUpdateSpacePropertyOutputSchema,
	displayName: 'Update Space Property',
	description: 'Replaces the value of a content property on a space.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Replaces the JSON value of an existing content property on a Confluence space, saving it as the next version; the key cannot be changed. Get the property ID from List Space Properties. Idempotent: setting the same value again leaves it unchanged.',
		idempotent: true,
	},
	props: {
		spaceId: confluenceAiProps.spaceId({ required: true }),
		propertyId: confluenceAiProps.propertyId({ required: true }),
		value: confluenceAiProps.propertyValue({
			required: true,
			description: 'New JSON object or array; replaces the current value.',
		}),
	},
	async run(context) {
		const { spaceId, propertyId, value } = context.propsValue;
		const current = await confluenceApi.getContentProperty({
			auth: context.auth,
			contentType: 'spaces',
			contentId: spaceId,
			propertyId,
		});
		return await confluenceApi.updateContentProperty({
			auth: context.auth,
			contentType: 'spaces',
			contentId: spaceId,
			propertyId,
			key: current.key,
			value,
			versionNumber: current.version.number + 1,
		});
	},
});
