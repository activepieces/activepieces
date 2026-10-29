import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAssociateProductAccountsOutputSchema } from '../../../output-schemas';

export const zohoDeskAssociateProductAccountsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_associate_product_accounts',
	outputSchema: zohoDeskAssociateProductAccountsOutputSchema,
	displayName: 'Associate Product Accounts',
	description: 'Links or unlinks accounts on a product.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Links accounts to one product, or unlinks them when Associate is No.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		productId: zohoDeskAiProps.productId({ required: true }),
		accountIds: Property.Array({
			displayName: 'Account IDs',
			description: 'Account IDs to link or unlink.',
			required: true,
		}),
		associate: zohoDeskAiProps.yesNo({
			required: true,
			displayName: 'Associate',
			description: 'Yes links the accounts, No unlinks them.',
		}),
	},
	async run(context) {
		const { orgId, productId, accountIds, associate } = context.propsValue;
		await zohoDeskApi.associateProductAccounts({
			auth: context.auth,
			orgId,
			productId,
			accountIds: zohoDeskUtils.requiredStringList({ value: accountIds, propName: 'Account IDs' }),
			associate,
		});
		return { success: true, productId, accountIds, associate };
	},
});
