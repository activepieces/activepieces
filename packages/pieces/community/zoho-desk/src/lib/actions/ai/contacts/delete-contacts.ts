import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskDeleteContactsOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteContactsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_contacts',
	outputSchema: zohoDeskDeleteContactsOutputSchema,
	displayName: 'Delete Contacts',
	description: 'Moves contacts to the recycle bin.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Moves one or more contacts to the recycle bin, where an admin can restore them. Needs the Desk.contacts.DELETE scope.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactIds: Property.Array({
			displayName: 'Contact IDs',
			description: 'Contact IDs to delete.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, contactIds } = context.propsValue;
		await zohoDeskApi.deleteContacts({
			auth: context.auth,
			orgId,
			contactIds: zohoDeskUtils.requiredStringList({ value: contactIds, propName: 'Contact IDs' }),
		});
		return { success: true, contactIds };
	},
});
