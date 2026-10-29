import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetProductOutputSchema } from '../../../output-schemas';

export const zohoDeskGetProductAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_product',
	outputSchema: zohoDeskGetProductOutputSchema,
	displayName: 'Get Product',
	description: 'Gets a product by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one product by ID with its code, price, category, departments and custom fields.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		productId: zohoDeskAiProps.productId({ required: true }),
	},
	async run(context) {
		const { orgId, productId } = context.propsValue;
		return await zohoDeskApi.getProduct({ auth: context.auth, orgId, productId });
	},
});
