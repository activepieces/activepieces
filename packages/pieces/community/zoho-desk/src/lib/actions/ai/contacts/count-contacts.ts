import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCountAccountsOutputSchema } from '../../../output-schemas';

export const zohoDeskCountContactsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_count_contacts',
	outputSchema: zohoDeskCountAccountsOutputSchema,
	displayName: 'Count Contacts',
	description: 'Counts the contacts in a view.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns the number of contacts in one contact view (from List Views, module contacts), optionally only names starting with a letter.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		viewId: Property.ShortText({
			displayName: 'View ID',
			description: 'Contact view ID (from List Views, module contacts).',
			required: true,
		}),
		startsWith: Property.ShortText({
			displayName: 'Starts With',
			description: 'Only contacts whose name starts with this letter.',
			required: false,
		}),
	},
	async run(context) {
		const { orgId, viewId, startsWith } = context.propsValue;
		return await zohoDeskApi.countContacts({ auth: context.auth, orgId, viewId, startsWith });
	},
});
