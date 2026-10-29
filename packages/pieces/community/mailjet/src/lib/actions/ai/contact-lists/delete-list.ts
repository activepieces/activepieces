import { createAction } from '@activepieces/pieces-framework';

import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetDeletedOutputSchema } from '../../../output-schemas';

export const mailjetDeleteListAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_delete_list',
	outputSchema: mailjetDeletedOutputSchema,
	displayName: 'Delete Contact List',
	description: 'Deletes a contact list.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes a contact list. The contacts themselves stay in the account. Use Update Contact List with Deleted = Yes for a reversible delete.',
		idempotent: false,
	},
	props: {
		listId: mailjetAiProps.id({
			displayName: 'Contact List ID',
			description: 'Numeric contact list ID, from List Contact Lists or Create Contact List.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.remove({
			auth: context.auth,
			path: `/v3/REST/contactslist/${encodeURIComponent(p.listId)}`,
		});
	},
});
