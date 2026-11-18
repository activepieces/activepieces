import { createAction } from '@activepieces/pieces-framework';

import { mailjetListOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetListAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_list',
	outputSchema: mailjetListOutputSchema,
	displayName: 'Get Contact List',
	description: 'Gets one contact list.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a contact list by its numeric ID, including its subscriber count.',
		idempotent: true,
	},
	props: {
		listId: mailjetAiProps.id({
			displayName: 'Contact List ID',
			description: 'Numeric contact list ID, from List Contact Lists or Create Contact List.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/contactslist/${encodeURIComponent(p.listId)}`,
		});
	},
});
