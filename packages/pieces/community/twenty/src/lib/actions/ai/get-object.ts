import { createAction, Property } from '@activepieces/pieces-framework';

import { twentyAuth } from '../../auth';
import { twentyApi } from '../../common/api';
import { twentyGetObjectOutputSchema } from '../../output-schemas';

export const getObjectAction = createAction({
	auth: twentyAuth,
	name: 'twenty_get_object',
	outputSchema: twentyGetObjectOutputSchema,
	displayName: 'Get Object',
	description: 'Gets one object definition with its fields.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets one object's definition, including every field's name, type, options and relation target. Use it before Create Record, Update Record or a filter to learn exact field names and select values. Needs the API key's role to have the Data Model settings permission.",
		idempotent: true,
	},
	props: {
		objectId: Property.ShortText({
			displayName: 'Object ID',
			description: 'UUID of the object (the `id` field), from List Objects. Not the object name.',
			required: true,
		}),
	},
	async run(context) {
		return await twentyApi.getObject({ auth: context.auth, objectId: context.propsValue.objectId });
	},
});
