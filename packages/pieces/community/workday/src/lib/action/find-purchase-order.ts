import {
	OAuth2PropertyValue,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { escapeWql, workdayWqlRequest } from '../common';

export const findPurchaseOrder = createAction({
	auth: workdayAuth,
	name: 'find_purchase_order',
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
	async run(ctx) {
		const { purchaseOrderId } = ctx.propsValue;
		const response = await workdayWqlRequest(
			ctx.auth as OAuth2PropertyValue,
			`SELECT purchaseOrder FROM purchaseOrders WHERE purchaseOrder = '${escapeWql(purchaseOrderId)}'`,
		);
		return response.body;
	},
});
