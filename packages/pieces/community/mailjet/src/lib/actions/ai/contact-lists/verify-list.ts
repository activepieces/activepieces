import { createAction } from '@activepieces/pieces-framework';

import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetJobOutputSchema } from '../../../output-schemas';

export const mailjetVerifyListAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_verify_list',
	outputSchema: mailjetJobOutputSchema,
	displayName: 'Verify Contact List',
	description: 'Starts an email verification job for a contact list.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Starts an asynchronous email verification of a contact list. Spends email-verification credits from the account. Returns a job ID; read the result with Get Verify Contact List Job.',
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
		return await mailjetApi.post({
			auth: context.auth,
			path: `/v3/REST/contactslist/${encodeURIComponent(p.listId)}/verify`,
			body: { Method: 'fulllist' },
		});
	},
});
