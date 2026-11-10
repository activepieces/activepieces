import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskGetProductOutputSchema } from '../../../output-schemas';

export const zohoDeskCreateProductAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_create_product',
	outputSchema: zohoDeskGetProductOutputSchema,
	displayName: 'Create Product',
	description: 'Creates a product.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a product available in the given departments. Not idempotent: each call creates a new product.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		productName: Property.ShortText({
			displayName: 'Product Name',
			description: 'Product name.',
			required: true,
		}),
		departmentIds: Property.Array({
			displayName: 'Department IDs',
			description: 'Departments the product is available in (from List Departments).',
			required: true,
		}),
		productCode: Property.ShortText({
			displayName: 'Product Code',
			description: 'Product code or SKU.',
			required: false,
		}),
		unitPrice: Property.Number({
			displayName: 'Unit Price',
			description: 'Unit price.',
			required: false,
		}),
		productCategory: Property.ShortText({
			displayName: 'Category',
			description: 'Product category.',
			required: false,
		}),
		manufacturer: Property.ShortText({
			displayName: 'Manufacturer',
			description: 'Manufacturer.',
			required: false,
		}),
		ownerId: Property.ShortText({
			displayName: 'Owner ID',
			description: 'Agent ID who owns the product (from List Agents).',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Product description.',
			required: false,
		}),
		customFields: Property.Object({
			displayName: 'Custom Fields',
			description: 'Custom field values keyed by API name (from List Fields, module products).',
			required: false,
		}),
	},
	async run(context) {
		const {
			orgId,
			productName,
			departmentIds,
			productCode,
			unitPrice,
			productCategory,
			manufacturer,
			ownerId,
			description,
			customFields,
		} = context.propsValue;
		return await zohoDeskApi.createProduct({
			auth: context.auth,
			orgId,
			productName,
			departmentIds: zohoDeskUtils.requiredStringList({
				value: departmentIds,
				propName: 'Department IDs',
			}),
			productCode,
			unitPrice,
			productCategory,
			manufacturer,
			ownerId,
			description,
			customFields,
		});
	},
});
