import { createAction } from '@activepieces/pieces-framework';

import { twentyAuth } from '../../auth';
import { twentyAiProps } from '../../common/ai-props';
import { twentyApi } from '../../common/api';
import { twentyListObjectsOutputSchema } from '../../output-schemas';

export const listObjectsAction = createAction({
	auth: twentyAuth,
	name: 'twenty_list_objects',
	outputSchema: twentyListObjectsOutputSchema,
	displayName: 'List Objects',
	description: 'Lists the standard and custom objects in the workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the workspace's objects (standard ones like people and companies, and custom ones) with their names and ids. Call it first to get the `namePlural` that every record action takes as Object, and the id Get Object needs. Needs the API key's role to have the Data Model settings permission.",
		idempotent: true,
	},
	props: {
		limit: twentyAiProps.limit({
			required: false,
			description: 'Maximum number of objects to return.',
		}),
		startingAfter: twentyAiProps.startingAfter({ required: false }),
	},
	async run(context) {
		const { limit, startingAfter } = context.propsValue;
		return await twentyApi.listObjects({ auth: context.auth, limit, startingAfter });
	},
});
