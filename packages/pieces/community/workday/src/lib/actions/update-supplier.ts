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
			'Updates an existing supplier (identified by its supplier WID) in Workday, setting any of name, a tax ID with its Tax ID Type (e.g. USA-EIN; other tax IDs are kept), and payment-terms WID. Use to amend supplier master data. Idempotent: keyed on the supplier ID, so re-sending the same field values converges to the same state.',
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
			description:
				'Supplier tax identification number. Needs Tax ID Type. Adds or replaces the tax ID of that type only; other tax IDs are kept.',
			required: false,
		}),
		taxIdType: Property.ShortText({
			displayName: 'Tax ID Type',
			description: 'Workday Tax ID Type reference ID, e.g. `USA-EIN`. Required when Tax ID is set.',
			required: false,
		}),
		paymentTermsId: Property.ShortText({
			displayName: 'Payment Terms ID',
			description: 'Payment terms reference ID.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await workdayApi.updateSupplier({
			auth,
			supplierId: propsValue.supplierId,
			supplierName: propsValue.supplierName,
			taxId: propsValue.taxId,
			taxIdType: propsValue.taxIdType,
			paymentTermsId: propsValue.paymentTermsId,
		});
	},
});
