import { createAction } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { deleteContactOutputSchema } from '../../output-schemas';

export const deleteContactAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_delete_contact',
	outputSchema: deleteContactOutputSchema,
	displayName: 'Delete Contact',
	description: 'Permanently deletes a contact from a list.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a contact from an EmailOctopus list, found by contact ID or email address. This is a hard delete and cannot be undone; to stop emailing someone but keep the record, use Update Contact with status unsubscribed.',
		idempotent: false,
	},
	props: {
		listId: emailOctopusAiProps.listId({ required: true }),
		contact: emailOctopusAiProps.contact({ required: true }),
	},
	async run(context) {
		const { listId, contact } = context.propsValue;
		await emailOctopusApi.deleteContact({ auth: context.auth, listId, contact });
		return { deleted: true, list_id: listId, contact };
	},
});
