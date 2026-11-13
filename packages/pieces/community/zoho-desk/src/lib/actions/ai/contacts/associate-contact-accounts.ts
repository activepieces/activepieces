import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAssociateAccountProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskAssociateContactAccountsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_associate_contact_accounts',
	outputSchema: zohoDeskAssociateAccountProductsOutputSchema,
	displayName: 'Associate Contact Accounts',
	description: 'Links accounts to a contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Links one contact to one or more accounts (from Search Accounts). Can View Account Tickets lets the contact see those accounts' tickets in the help center; it defaults to No.",
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		accountIds: Property.Array({
			displayName: 'Account IDs',
			description: 'Account IDs to link.',
			required: true,
		}),
		canViewAccountTickets: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Can View Account Tickets',
			description:
				"Yes lets the contact see the accounts' tickets in the help center. Defaults to No.",
		}),
	},
	async run(context) {
		const { orgId, contactId, accountIds, canViewAccountTickets } = context.propsValue;
		return await zohoDeskApi.associateContactAccounts({
			auth: context.auth,
			orgId,
			contactId,
			accountIds: zohoDeskUtils.requiredStringList({ value: accountIds, propName: 'Account IDs' }),
			canViewAccountTickets,
		});
	},
});
