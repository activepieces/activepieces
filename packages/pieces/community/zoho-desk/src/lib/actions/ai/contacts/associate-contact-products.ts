import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAssociateAccountProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskAssociateContactProductsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_associate_contact_products',
	outputSchema: zohoDeskAssociateAccountProductsOutputSchema,
	displayName: 'Associate Contact Products',
	description: 'Links or unlinks products on a contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Links products (from List Products) to one contact, or unlinks them when Associate is No.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
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
		const { orgId, contactId, productIds, associate, departmentId } = context.propsValue;
		return await zohoDeskApi.associateContactProducts({
			auth: context.auth,
			orgId,
			contactId,
			productIds: zohoDeskUtils.requiredStringList({ value: productIds, propName: 'Product IDs' }),
			associate,
			departmentId,
		});
	},
});
