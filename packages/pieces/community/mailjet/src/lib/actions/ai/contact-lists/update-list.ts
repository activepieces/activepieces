import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetListOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUpdateListAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_update_list',
	outputSchema: mailjetListOutputSchema,
	displayName: 'Update Contact List',
	description: 'Renames a contact list or changes its deleted state.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates the name and/or deleted state of a contact list. Only the fields you set change. Marking a list deleted can be reverted by setting Deleted to No.',
		idempotent: true,
	},
	props: {
		listId: mailjetAiProps.id({
			displayName: 'Contact List ID',
			description: 'Numeric contact list ID, from List Contact Lists or Create Contact List.',
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New list name, unique in the account.',
			required: false,
		}),
		isDeleted: mailjetAiProps.yesNo({
			displayName: 'Deleted',
			description: 'Yes marks the list deleted, No restores it.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.put({
			auth: context.auth,
			path: `/v3/REST/contactslist/${encodeURIComponent(p.listId)}`,
			body: { Name: p.name, IsDeleted: p.isDeleted },
		});
	},
});
