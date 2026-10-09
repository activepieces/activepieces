import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetJobOutputSchema } from '../../../output-schemas';

export const mailjetBulkManageListContactsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_bulk_manage_list_contacts',
	outputSchema: mailjetJobOutputSchema,
	displayName: 'Bulk Manage List Contacts',
	description: 'Starts a job that applies one action to many contacts in one list.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Starts an asynchronous job that applies one action (addforce, addnoforce, remove, unsub) to many contacts in one list, creating missing contacts. Returns a JobID; read the result with Get Bulk Manage List Contacts Job.',
		idempotent: false,
	},
	props: {
		listId: mailjetAiProps.id({
			displayName: 'Contact List ID',
			description: 'Numeric contact list ID, from List Contact Lists or Create Contact List.',
		}),
		action: mailjetAiProps.listAction({
			description: 'What to do with every contact in this list.',
		}),
		contacts: Property.Json({
			displayName: 'Contacts',
			description:
				'JSON array of contacts, e.g. [{"Email":"jane@example.com","Name":"Jane","Properties":{"city":"Paris"}}].',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: `/v3/REST/contactslist/${encodeURIComponent(p.listId)}/managemanycontacts`,
			body: { Action: p.action, Contacts: p.contacts },
		});
	},
});
