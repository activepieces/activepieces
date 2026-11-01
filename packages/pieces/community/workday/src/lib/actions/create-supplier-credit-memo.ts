import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';

export const createSupplierCreditMemoAction = createAction({
	auth: workdayAuth,
	name: 'create_supplier_credit_memo',
	classification: 'WRITE',
	displayName: 'Create Supplier Credit Memo',
	description: 'Creates a new supplier credit memo in Workday.',
	audience: 'both',
	aiMetadata: {
		description:
			'Submits a supplier invoice adjustment (credit memo) against a supplier (by WID) with an adjustment date and control-total amount, plus an optional memo. Use to record a credit owed by a supplier. Not idempotent: each call submits a separate credit memo.',
		idempotent: false,
	},
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
	},
	async run({ auth, propsValue }) {
		return await workdayApi.createSupplierCreditMemo({
			auth,
			supplierId: propsValue.supplierId,
			memoDate: propsValue.memoDate,
			amount: propsValue.amount,
			description: propsValue.description,
		});
	},
});
