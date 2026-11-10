import { createAction } from '@activepieces/pieces-framework';

import { mailjetContactListSubscriptionOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetListListsForContactAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_lists_for_contact',
	outputSchema: mailjetContactListSubscriptionOutputSchema,
	displayName: 'List Lists for Contact',
	description: 'Lists the contact lists one contact belongs to.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every contact list the contact is in, with its subscription state (IsUnsub) per list. For all lists in the account use List Contact Lists.',
		idempotent: true,
	},
	props: {
		contactId: mailjetAiProps.id({
			displayName: 'Contact ID or Email',
			description: 'Numeric contact ID (from List Contacts) or the contact email.',
		}),
	},
	async run(context) {
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/contact/${encodeURIComponent(context.propsValue.contactId)}/getcontactslists`,
		});
	},
});
