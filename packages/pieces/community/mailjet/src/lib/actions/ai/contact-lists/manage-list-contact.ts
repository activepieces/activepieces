import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetManageListContactOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetManageListContactAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_manage_list_contact',
	outputSchema: mailjetManageListContactOutputSchema,
	displayName: 'Add Contact to List',
	description: 'Adds, removes or unsubscribes one contact in a contact list.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Applies one action to one email in a list: addforce (add and subscribe), addnoforce (add, keep unsubscribed state), remove or unsub. Creates the contact when it does not exist and can set its properties.',
		idempotent: true,
	},
	props: {
		listId: mailjetAiProps.id({
			displayName: 'Contact List ID',
			description: 'Numeric contact list ID, from List Contact Lists or Create Contact List.',
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Contact email address.',
			required: true,
		}),
		action: mailjetAiProps.listAction({ description: 'What to do with the contact in this list.' }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Contact display name, used when the contact is created.',
			required: false,
		}),
		properties: Property.Object({
			displayName: 'Properties',
			description: 'Contact property values as name/value pairs; the properties must exist.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: `/v3/REST/contactslist/${encodeURIComponent(p.listId)}/managecontact`,
			body: { Email: p.email, Action: p.action, Name: p.name, Properties: p.properties },
		});
	},
});
