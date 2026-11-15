import { createAction, Property } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { listOutputSchema } from '../../output-schemas';

export const updateListAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_update_list',
	outputSchema: listOutputSchema,
	displayName: 'Rename List',
	description: 'Renames a mailing list.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Renames an EmailOctopus list. The name is the only list setting the API can change; manage fields and tags with their own actions.',
		idempotent: true,
	},
	props: {
		listId: emailOctopusAiProps.listId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The new name for the list.',
			required: true,
		}),
	},
	async run(context) {
		const { listId, name } = context.propsValue;
		return await emailOctopusApi.updateList({ auth: context.auth, listId, name });
	},
});
