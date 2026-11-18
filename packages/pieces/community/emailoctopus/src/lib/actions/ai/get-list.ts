import { createAction } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { listOutputSchema } from '../../output-schemas';

export const getListAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_get_list',
	outputSchema: listOutputSchema,
	displayName: 'Get List',
	description: 'Gets one list with its fields, tags and contact counts.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one EmailOctopus list by ID, including its custom fields (tag, label, type, choices), tags and contact counts. Use it before writing contact fields, to learn the field tags and types.',
		idempotent: true,
	},
	props: {
		listId: emailOctopusAiProps.listId({ required: true }),
	},
	async run(context) {
		return await emailOctopusApi.getList({
			auth: context.auth,
			listId: context.propsValue.listId,
		});
	},
});
