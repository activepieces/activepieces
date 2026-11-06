import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAssociateProductContactsOutputSchema } from '../../../output-schemas';

export const zohoDeskAssociateProductContactsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_associate_product_contacts',
	outputSchema: zohoDeskAssociateProductContactsOutputSchema,
	displayName: 'Associate Product Contacts',
	description: 'Links or unlinks contacts on a product.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Links contacts to one product, or unlinks them when Associate is No.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		productId: zohoDeskAiProps.productId({ required: true }),
		contactIds: Property.Array({
			displayName: 'Contact IDs',
			description: 'Contact IDs to link or unlink.',
			required: true,
		}),
		associate: zohoDeskAiProps.yesNo({
			required: true,
			displayName: 'Associate',
			description: 'Yes links the contacts, No unlinks them.',
		}),
	},
	async run(context) {
		const { orgId, productId, contactIds, associate } = context.propsValue;
		await zohoDeskApi.associateProductContacts({
			auth: context.auth,
			orgId,
			productId,
			contactIds: zohoDeskUtils.requiredStringList({ value: contactIds, propName: 'Contact IDs' }),
			associate,
		});
		return { success: true, productId, contactIds, associate };
	},
});
