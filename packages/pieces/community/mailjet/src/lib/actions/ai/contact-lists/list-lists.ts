import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetListOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListListsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_lists',
	outputSchema: mailjetListOutputSchema,
	displayName: 'List Contact Lists',
	description: 'Lists the contact lists of the account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists contact lists with their IDs, names and subscriber counts. Filter by name or deleted state. Page with Limit and Offset; the response has Total.',
		idempotent: true,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Only the list with this exact name.',
			required: false,
		}),
		isDeleted: mailjetAiProps.yesNo({
			displayName: 'Deleted',
			description: 'Yes for lists marked deleted only, No for active lists only.',
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/contactslist',
			query: { Name: p.name, IsDeleted: p.isDeleted, ...mailjetUtils.pagingQuery(p) },
		});
	},
});
