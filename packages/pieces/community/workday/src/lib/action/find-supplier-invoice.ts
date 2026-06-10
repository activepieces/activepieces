import {
	OAuth2PropertyValue,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { escapeWql, workdayWqlRequest } from '../common';

export const findSupplierInvoice = createAction({
	auth: workdayAuth,
	name: 'find_supplier_invoice',
	displayName: 'Find Supplier Invoice',
	description: 'Finds a supplier invoice by ID in Workday using WQL.',
	props: {
		invoiceId: Property.ShortText({
			displayName: 'Invoice ID',
			description: 'The ID of the supplier invoice to find.',
			required: true,
		}),
	},
	async run(ctx) {
		const { invoiceId } = ctx.propsValue;
		const response = await workdayWqlRequest(
			ctx.auth as OAuth2PropertyValue,
			`SELECT supplierInvoice FROM supplierInvoices WHERE supplierInvoice = '${escapeWql(invoiceId)}'`,
		);
		return response.body;
	},
});
