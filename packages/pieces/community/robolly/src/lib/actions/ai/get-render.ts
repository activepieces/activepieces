import { createAction, Property } from '@activepieces/pieces-framework';

import { robollyAuth } from '../../auth';
import { robollyApi } from '../../common/api';
import { robollyGetRenderOutputSchema } from '../../output-schemas';

export const getRenderAction = createAction({
	auth: robollyAuth,
	name: 'robolly_get_render',
	outputSchema: robollyGetRenderOutputSchema,
	displayName: 'Get Render',
	description: 'Gets one render by ID, with its status and file URL.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one render by ID with its status, file URL and preview URL. Use it to check a past render found with List Renders. Fails when no render has that ID.',
		idempotent: true,
	},
	props: {
		renderId: Property.ShortText({
			displayName: 'Render ID',
			description: 'The render ID, from List Renders.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await robollyApi.getRender({ auth, renderId: propsValue.renderId });
	},
});
