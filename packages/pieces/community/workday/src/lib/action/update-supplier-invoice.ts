import {
	OAuth2PropertyValue,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdaySoapRequest } from '../common';

export const updateSupplierInvoice = createAction({
	auth: workdayAuth,
	name: 'update_supplier_invoice',
	displayName: 'Update Supplier Invoice',
	description: 'Updates an existing supplier invoice in Workday.',
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
		additionalData: Property.Object({
			displayName: 'Additional Data',
			description: 'Additional fields as key-value pairs.',
			required: false,
		}),
	},
	async run(ctx) {
		const { invoiceId, invoiceDate, invoiceNumber, total } = ctx.propsValue;

		const escapeXml = (s: string) =>
			s
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;');

		let invoiceDataFields = '';
		if (invoiceDate) {
			invoiceDataFields += `
        <bsvc:Invoice_Date>${escapeXml(invoiceDate)}</bsvc:Invoice_Date>`;
		}
		if (invoiceNumber) {
			invoiceDataFields += `
        <bsvc:Invoice_Number>${escapeXml(invoiceNumber)}</bsvc:Invoice_Number>`;
		}
		if (total) {
			invoiceDataFields += `
        <bsvc:Total_Amount>${escapeXml(total)}</bsvc:Total_Amount>`;
		}

		const operationXml = `
    <bsvc:Submit_Supplier_Invoice_Request bsvc:version="v46.0" xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Supplier_Invoice_Reference>
        <bsvc:ID bsvc:type="WID">${escapeXml(invoiceId)}</bsvc:ID>
      </bsvc:Supplier_Invoice_Reference>
      <bsvc:Supplier_Invoice_Data>${invoiceDataFields}
      </bsvc:Supplier_Invoice_Data>
    </bsvc:Submit_Supplier_Invoice_Request>`;

		return workdaySoapRequest(
			ctx.auth as OAuth2PropertyValue,
			'Resource_Management',
			operationXml,
		);
	},
});
