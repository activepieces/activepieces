import {
	OAuth2PropertyValue,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdaySoapRequest } from '../common';

export const createSupplierCreditMemo = createAction({
	auth: workdayAuth,
	name: 'create_supplier_credit_memo',
	displayName: 'Create Supplier Credit Memo',
	description: 'Creates a new supplier credit memo in Workday.',
	props: {
		supplierId: Property.ShortText({
			displayName: 'Supplier ID',
			description: 'The ID of the supplier.',
			required: true,
		}),
		memoDate: Property.ShortText({
			displayName: 'Memo Date',
			description: 'Credit memo date (YYYY-MM-DD).',
			required: true,
		}),
		amount: Property.ShortText({
			displayName: 'Amount',
			description: 'Credit memo amount.',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Description of the credit memo.',
			required: false,
		}),
		additionalData: Property.Object({
			displayName: 'Additional Data',
			description: 'Additional fields as key-value pairs.',
			required: false,
		}),
	},
	async run(ctx) {
		const { supplierId, memoDate, amount, description } = ctx.propsValue;

		const escapeXml = (s: string) =>
			s
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;');

		let memoXml = '';
		if (description) {
			memoXml = `
        <bsvc:Document_Memo>${escapeXml(description)}</bsvc:Document_Memo>`;
		}

		const operationXml = `
    <bsvc:Submit_Supplier_Invoice_Adjustment_Request bsvc:version="v46.0" xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Business_Process_Parameters>
        <bsvc:Auto_Complete>true</bsvc:Auto_Complete>
      </bsvc:Business_Process_Parameters>
      <bsvc:Supplier_Invoice_Adjustment_Data>
        <bsvc:Submit>true</bsvc:Submit>
        <bsvc:Supplier_Reference>
          <bsvc:ID bsvc:type="WID">${escapeXml(supplierId)}</bsvc:ID>
        </bsvc:Supplier_Reference>
        <bsvc:Adjustment_Date>${escapeXml(memoDate)}</bsvc:Adjustment_Date>
        <bsvc:Control_Total_Amount>${escapeXml(amount)}</bsvc:Control_Total_Amount>${memoXml}
      </bsvc:Supplier_Invoice_Adjustment_Data>
    </bsvc:Submit_Supplier_Invoice_Adjustment_Request>`;

		return workdaySoapRequest(
			ctx.auth as OAuth2PropertyValue,
			'Resource_Management',
			operationXml,
		);
	},
});
