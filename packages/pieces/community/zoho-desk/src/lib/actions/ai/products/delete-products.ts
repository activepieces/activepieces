import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskDeleteProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteProductsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_products',
	outputSchema: zohoDeskDeleteProductsOutputSchema,
	displayName: 'Delete Products',
	description: 'Moves products to the recycle bin.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Moves one or more products to the recycle bin, where an admin can restore them.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		productIds: Property.Array({
			displayName: 'Product IDs',
			description: 'Product IDs to delete.',
			required: true,
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
	},
	async run(context) {
		const { orgId, productIds, departmentId } = context.propsValue;
		await zohoDeskApi.deleteProducts({
			auth: context.auth,
			orgId,
			productIds: zohoDeskUtils.requiredStringList({ value: productIds, propName: 'Product IDs' }),
			departmentId,
		});
		return { success: true, productIds };
	},
});
