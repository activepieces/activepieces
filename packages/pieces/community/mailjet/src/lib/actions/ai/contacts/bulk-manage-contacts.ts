import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetAuth } from '../../../auth';
import { mailjetApi } from '../../../common/api';
import { mailjetJobOutputSchema } from '../../../output-schemas';

export const mailjetBulkManageContactsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_bulk_manage_contacts',
	outputSchema: mailjetJobOutputSchema,
	displayName: 'Bulk Manage Contacts',
	description: 'Starts a job that creates or updates many contacts and their list memberships.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Starts an asynchronous job that upserts many contacts (with properties) and applies list actions to all of them. Returns a JobID; read the result with Get Bulk Manage Contacts Job.',
		idempotent: false,
	},
	props: {
		contacts: Property.Json({
			displayName: 'Contacts',
			description:
				'JSON array of contacts, e.g. [{"Email":"jane@example.com","Name":"Jane","Properties":{"city":"Paris"}}].',
			required: true,
		}),
		contactsLists: Property.Json({
			displayName: 'Lists',
			description:
				'Optional JSON array of list actions for every contact, e.g. [{"ListID":123,"Action":"addnoforce"}].',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: '/v3/REST/contact/managemanycontacts',
			body: { Contacts: p.contacts, ContactsLists: p.contactsLists },
		});
	},
});
