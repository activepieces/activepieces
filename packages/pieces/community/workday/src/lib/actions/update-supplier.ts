import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';

export const updateSupplierAction = createAction({
	auth: workdayAuth,
	name: 'update_supplier',
	classification: 'WRITE',
	displayName: 'Update Supplier',
	description: 'Updates an existing supplier in Workday.',
	audience: 'both',
	aiMetadata: {
		description:
			'Updates an existing supplier (identified by its supplier WID) in Workday, setting any of name, tax ID, and payment-terms WID. Use to amend supplier master data. Idempotent: keyed on the supplier ID, so re-sending the same field values converges to the same state.',
		idempotent: true,
	},
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
	async run({ auth, propsValue }) {
		return await workdayApi.updateSupplier({
			auth,
			supplierId: propsValue.supplierId,
			supplierName: propsValue.supplierName,
			taxId: propsValue.taxId,
			paymentTermsId: propsValue.paymentTermsId,
		});
	},
});
