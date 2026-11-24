import { createAction } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { deleteFieldOrTagOutputSchema } from '../../output-schemas';

export const deleteTagAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_delete_tag',
	outputSchema: deleteFieldOrTagOutputSchema,
	displayName: 'Delete Tag',
	description: 'Deletes a tag from a list.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a tag from an EmailOctopus list and removes it from every contact. To untag one contact, use Update Contact with Tags to Remove.',
		idempotent: false,
	},
	props: {
		listId: emailOctopusAiProps.listId({ required: true }),
		tag: emailOctopusAiProps.tag({ required: true }),
	},
	async run(context) {
		const { listId, tag } = context.propsValue;
		await emailOctopusApi.deleteTag({ auth: context.auth, listId, tag });
		return { deleted: true, list_id: listId, tag };
	},
});
