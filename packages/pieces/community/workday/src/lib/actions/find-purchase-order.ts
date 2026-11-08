import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';

export const findPurchaseOrderAction = createAction({
	auth: workdayAuth,
	name: 'find_purchase_order',
	classification: 'READ',
	displayName: 'Find Purchase Order',
	description: 'Finds a purchase order by ID in Workday using WQL.',
	audience: 'both',
	aiMetadata: {
		description:
			'Looks up a single purchase order by its ID via a Workday Query Language (WQL) query against the purchaseOrders dataset. Use to resolve or verify a purchase order when you already have its ID. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		purchaseOrderId: Property.ShortText({
			displayName: 'Purchase Order ID',
			description: 'The ID of the purchase order to find.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await workdayApi.findPurchaseOrder({
			auth,
			purchaseOrderId: propsValue.purchaseOrderId,
		});
	},
});
