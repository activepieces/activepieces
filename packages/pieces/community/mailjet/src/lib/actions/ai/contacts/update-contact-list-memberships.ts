import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetContactListMembershipsOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUpdateContactListMembershipsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_update_contact_list_memberships',
	outputSchema: mailjetContactListMembershipsOutputSchema,
	displayName: 'Update Contact List Memberships',
	description: 'Adds, removes or unsubscribes one contact across several lists.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Applies one action per list to a single contact: addforce (add and subscribe), addnoforce (add, keep unsubscribed state), remove or unsub. For many contacts use Bulk Manage Contacts.',
		idempotent: true,
	},
	props: {
		contactId: mailjetAiProps.id({
			displayName: 'Contact ID or Email',
			description: 'Numeric contact ID (from List Contacts) or the contact email.',
		}),
		contactsLists: Property.Json({
			displayName: 'Lists',
			description:
				'JSON array of list actions, e.g. [{"ListID":123,"Action":"addforce"}]. Action is addforce, addnoforce, remove or unsub.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: `/v3/REST/contact/${encodeURIComponent(p.contactId)}/managecontactslists`,
			body: { ContactsLists: p.contactsLists },
		});
	},
});
