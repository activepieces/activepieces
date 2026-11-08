import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';

export const updateSupplierInvoiceAction = createAction({
	auth: workdayAuth,
	name: 'update_supplier_invoice',
	classification: 'WRITE',
	displayName: 'Update Supplier Invoice',
	description: 'Updates an existing supplier invoice in Workday.',
	audience: 'both',
	aiMetadata: {
		description:
			'Updates an existing supplier invoice (identified by its invoice WID) in Workday, setting any of invoice date, invoice number, and total amount. Use to amend an existing supplier invoice. Idempotent: keyed on the invoice ID, so re-sending the same field values converges to the same state.',
		idempotent: true,
	},
	props: {
		invoiceId: Property.ShortText({
			displayName: 'Invoice ID',
			description: 'The ID of the supplier invoice to update.',
			required: true,
		}),
		invoiceDate: Property.ShortText({
			displayName: 'Invoice Date',
			description: 'Invoice date (YYYY-MM-DD).',
			required: false,
		}),
		invoiceNumber: Property.ShortText({
			displayName: 'Invoice Number',
			description: 'Invoice number.',
			required: false,
		}),
		total: Property.ShortText({
			displayName: 'Total Amount',
			description: 'Invoice total amount.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await workdayApi.updateSupplierInvoice({
			auth,
			invoiceId: propsValue.invoiceId,
			invoiceDate: propsValue.invoiceDate,
			invoiceNumber: propsValue.invoiceNumber,
			total: propsValue.total,
		});
	},
});
