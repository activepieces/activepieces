import { createAction } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { deleteListOutputSchema } from '../../output-schemas';

export const deleteListAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_delete_list',
	outputSchema: deleteListOutputSchema,
	displayName: 'Delete List',
	description: 'Permanently deletes a list and all its contacts.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes an EmailOctopus list together with all of its contacts, fields and tags. Cannot be undone.',
		idempotent: false,
	},
	props: {
		listId: emailOctopusAiProps.listId({ required: true }),
	},
	async run(context) {
		const { listId } = context.propsValue;
		await emailOctopusApi.deleteList({ auth: context.auth, listId });
		return { deleted: true, list_id: listId };
	},
});
