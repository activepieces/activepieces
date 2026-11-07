import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAssociateAccountProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskDissociateContactAccountsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_dissociate_contact_accounts',
	outputSchema: zohoDeskAssociateAccountProductsOutputSchema,
	displayName: 'Dissociate Contact Accounts',
	description: 'Unlinks accounts from a contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: { description: 'Unlinks one or more accounts from one contact.', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		accountIds: Property.Array({
			displayName: 'Account IDs',
			description: 'Account IDs to unlink.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, contactId, accountIds } = context.propsValue;
		return await zohoDeskApi.dissociateContactAccounts({
			auth: context.auth,
			orgId,
			contactId,
			accountIds: zohoDeskUtils.requiredStringList({ value: accountIds, propName: 'Account IDs' }),
		});
	},
});
