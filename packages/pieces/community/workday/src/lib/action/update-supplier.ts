import {
	OAuth2PropertyValue,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdaySoapRequest } from '../common';

export const updateSupplier = createAction({
	auth: workdayAuth,
	name: 'update_supplier',
	displayName: 'Update Supplier',
	description: 'Updates an existing supplier in Workday.',
	props: {
		supplierId: Property.ShortText({
			displayName: 'Supplier ID',
			description: 'The ID of the supplier to update.',
			required: true,
		}),
		supplierName: Property.ShortText({
			displayName: 'Supplier Name',
			description: 'Updated supplier name.',
			required: false,
		}),
		taxId: Property.ShortText({
			displayName: 'Tax ID',
			description: 'Supplier tax identification number.',
			required: false,
		}),
		paymentTermsId: Property.ShortText({
			displayName: 'Payment Terms ID',
			description: 'Payment terms reference ID.',
			required: false,
		}),
		additionalData: Property.Object({
			displayName: 'Additional Data',
			description: 'Additional fields as key-value pairs.',
			required: false,
		}),
	},
	async run(ctx) {
		const { supplierId, supplierName, taxId, paymentTermsId } = ctx.propsValue;

		const escapeXml = (s: string) =>
			s
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;');

		let supplierDataFields = '';
		if (supplierName) {
			supplierDataFields += `
        <bsvc:Supplier_Name>${escapeXml(supplierName)}</bsvc:Supplier_Name>`;
		}
		if (taxId) {
			supplierDataFields += `
        <bsvc:Tax_ID>${escapeXml(taxId)}</bsvc:Tax_ID>`;
		}
		if (paymentTermsId) {
			supplierDataFields += `
        <bsvc:Payment_Terms_Reference>
          <bsvc:ID bsvc:type="WID">${escapeXml(paymentTermsId)}</bsvc:ID>
        </bsvc:Payment_Terms_Reference>`;
		}

		const operationXml = `
    <bsvc:Submit_Supplier_Request bsvc:version="v46.0" xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Supplier_Reference>
        <bsvc:ID bsvc:type="WID">${escapeXml(supplierId)}</bsvc:ID>
      </bsvc:Supplier_Reference>
      <bsvc:Supplier_Data>${supplierDataFields}
      </bsvc:Supplier_Data>
    </bsvc:Submit_Supplier_Request>`;

		return workdaySoapRequest(
			ctx.auth as OAuth2PropertyValue,
			'Resource_Management',
			operationXml,
		);
	},
});
