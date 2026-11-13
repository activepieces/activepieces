import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAssociateAccountProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteSpamContactsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_spam_contacts',
	outputSchema: zohoDeskAssociateAccountProductsOutputSchema,
	displayName: 'Delete Spam Contacts',
	description: 'Permanently deletes contacts that are marked as spam.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes contacts that are already marked as spam (see Mark Contacts Spam). This cannot be undone.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactIds: Property.Array({
			displayName: 'Contact IDs',
			description: 'IDs of spam contacts to delete.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, contactIds } = context.propsValue;
		return await zohoDeskApi.deleteSpamContacts({
			auth: context.auth,
			orgId,
			contactIds: zohoDeskUtils.requiredStringList({ value: contactIds, propName: 'Contact IDs' }),
		});
	},
});
