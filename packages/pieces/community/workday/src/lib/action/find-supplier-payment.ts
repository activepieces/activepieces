import {
	OAuth2PropertyValue,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { escapeWql, workdayWqlRequest } from '../common';

export const findSupplierPayment = createAction({
	auth: workdayAuth,
	name: 'find_supplier_payment',
	displayName: 'Find Supplier Payment',
	description: 'Finds supplier payments in Workday using WQL.',
	props: {
		supplierId: Property.ShortText({
			displayName: 'Supplier ID',
			description: 'Filter payments by supplier ID.',
			required: false,
		}),
		paymentId: Property.ShortText({
			displayName: 'Payment ID',
			description: 'The ID of a specific payment to find.',
			required: false,
		}),
	},
	async run(ctx) {
		const { supplierId, paymentId } = ctx.propsValue;
		const conditions: string[] = [];
		if (supplierId) conditions.push(`supplier = '${escapeWql(supplierId)}'`);
		if (paymentId) conditions.push(`supplierPayment = '${escapeWql(paymentId)}'`);

		const whereClause =
			conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
		const response = await workdayWqlRequest(
			ctx.auth as OAuth2PropertyValue,
			`SELECT supplierPayment FROM supplierPayments${whereClause}`,
		);
		return response.body;
	},
});
