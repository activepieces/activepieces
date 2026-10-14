import {
	OAuth2PropertyValue,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdaySoapRequest } from '../common';

export const findSupplierInvoice = createAction({
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
	async run(ctx) {
		const invoiceId = ctx.propsValue.invoiceId.trim();
		const idType = WID_PATTERN.test(invoiceId) ? 'WID' : 'Supplier_Invoice_Reference_ID';
		const escapedId = invoiceId
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

		const operationXml = `
    <bsvc:Get_Supplier_Invoices_Request bsvc:version="v46.0" xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Request_References>
        <bsvc:Supplier_Invoice_Reference>
          <bsvc:ID bsvc:type="${idType}">${escapedId}</bsvc:ID>
        </bsvc:Supplier_Invoice_Reference>
      </bsvc:Request_References>
    </bsvc:Get_Supplier_Invoices_Request>`;

		const body = await workdaySoapRequest(
			ctx.auth as OAuth2PropertyValue,
			'Resource_Management',
			operationXml,
		);
		const invoice = readSupplierInvoice(body);
		if (!invoice) {
			throw new Error(`No supplier invoice found for ID "${invoiceId}".`);
		}
		return invoice;
	},
});

function readSupplierInvoice(body: Record<string, unknown>): Record<string, unknown> | undefined {
	const response = asRecord(body['Get_Supplier_Invoices_Response']);
	const responseData = asRecord(response?.['Response_Data']);
	const invoice = responseData?.['Supplier_Invoice'];
	return asRecord(Array.isArray(invoice) ? invoice[0] : invoice);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
	if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
		return Object.fromEntries(Object.entries(value));
	}
	return undefined;
}

const WID_PATTERN = /^[0-9a-f]{32}$/i;
