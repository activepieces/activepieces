import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetListOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetApi } from '../../../common/api';

export const mailjetCreateListAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_create_list',
	outputSchema: mailjetListOutputSchema,
	displayName: 'Create Contact List',
	description: 'Creates a contact list.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a contact list. The name must be unique in the account.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'List name, unique in the account.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: '/v3/REST/contactslist',
			body: { Name: p.name },
		});
	},
});
