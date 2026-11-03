import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAssociateAccountProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskAssociateAccountProductsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_associate_account_products',
	outputSchema: zohoDeskAssociateAccountProductsOutputSchema,
	displayName: 'Associate Account Products',
	description: 'Links or unlinks products on an account.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Links products (from List Products) to one account, or unlinks them when Associate is No.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		productIds: Property.Array({
			displayName: 'Product IDs',
			description: 'Product IDs to link or unlink.',
			required: true,
		}),
		associate: zohoDeskAiProps.yesNo({
			required: true,
			displayName: 'Associate',
			description: 'Yes links the products, No unlinks them.',
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
	},
	async run(context) {
		const { orgId, accountId, productIds, associate, departmentId } = context.propsValue;
		return await zohoDeskApi.associateAccountProducts({
			auth: context.auth,
			orgId,
			accountId,
			productIds: zohoDeskUtils.requiredStringList({ value: productIds, propName: 'Product IDs' }),
			associate,
			departmentId,
		});
	},
});
