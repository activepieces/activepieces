import { createAction, Property } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { deleteFieldOrTagOutputSchema } from '../../output-schemas';

export const deleteFieldAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_delete_field',
	outputSchema: deleteFieldOrTagOutputSchema,
	displayName: 'Delete Field',
	description: 'Deletes a custom field from a list.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			"Permanently deletes a custom field from an EmailOctopus list, along with every contact's value for it. Cannot be undone.",
		idempotent: false,
	},
	props: {
		listId: emailOctopusAiProps.listId({ required: true }),
		tag: Property.ShortText({
			displayName: 'Field Tag',
			description: 'The tag of the field to delete. Use Get List to see the fields.',
			required: true,
		}),
	},
	async run(context) {
		const { listId, tag } = context.propsValue;
		await emailOctopusApi.deleteField({ auth: context.auth, listId, tag });
		return { deleted: true, list_id: listId, tag };
	},
});
