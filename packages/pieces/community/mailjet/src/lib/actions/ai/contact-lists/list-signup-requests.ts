import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetSignupRequestOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListSignupRequestsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_signup_requests',
	outputSchema: mailjetSignupRequestOutputSchema,
	displayName: 'List Signup Requests',
	description: 'Lists double opt-in signup requests.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists subscription-widget signup requests with their confirmation state. Filter by contact list or email. Page with Limit and Offset.',
		idempotent: true,
	},
	props: {
		contactsListId: Property.Number({
			displayName: 'Contact List ID',
			description: 'Only requests for this list.',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Only requests from this email.',
			required: false,
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/contactslistsignup',
			query: { ContactsList: p.contactsListId, Email: p.email, ...mailjetUtils.pagingQuery(p) },
		});
	},
});
