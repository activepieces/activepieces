import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';

export const findSupplierInvoiceAction = createAction({
	auth: workdayAuth,
	name: 'find_supplier_invoice',
	classification: 'READ',
	displayName: 'Find Supplier Invoice',
	description: 'Finds a supplier invoice by its Workday ID or Supplier Invoice ID.',
	audience: 'both',
	aiMetadata: {
		description:
			'Looks up a single supplier invoice through the Resource_Management Get_Supplier_Invoices web service, by its Workday ID (32-character WID) or its Supplier Invoice ID (e.g. `SUPPLIER_INVOICE-11-894`). The supplier-facing invoice number (e.g. `SINV-10000885`) is not a lookup key. Returns the invoice data with its reference IDs. Requires ISU credentials on the connection. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		invoiceId: Property.ShortText({
			displayName: 'Invoice ID',
			description:
				'The invoice Workday ID (WID) or Supplier Invoice ID, e.g. `SUPPLIER_INVOICE-11-894`. The invoice number (e.g. `SINV-10000885`) is not accepted.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const invoiceId = propsValue.invoiceId.trim();
		const invoice = await workdayApi.getSupplierInvoice({ auth, invoiceId });
		if (!invoice) {
			throw new Error(`No supplier invoice found for ID "${invoiceId}".`);
		}
		return invoice;
	},
});
