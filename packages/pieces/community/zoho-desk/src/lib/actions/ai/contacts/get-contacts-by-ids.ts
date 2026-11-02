import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskGetContactsByIdsOutputSchema } from '../../../output-schemas';

export const zohoDeskGetContactsByIdsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_contacts_by_ids',
	outputSchema: zohoDeskGetContactsByIdsOutputSchema,
	displayName: 'Get Contacts By IDs',
	description: 'Gets several contacts by ID in one call.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets several contacts by ID in one call, in the same shape as Get Contact.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactIds: Property.Array({
			displayName: 'Contact IDs',
			description: 'Contact IDs to fetch.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, contactIds } = context.propsValue;
		const contacts = await zohoDeskApi.getContactsByIds({
			auth: context.auth,
			orgId,
			contactIds: zohoDeskUtils.requiredStringList({ value: contactIds, propName: 'Contact IDs' }),
		});
		return { contacts, count: contacts.length };
	},
});
