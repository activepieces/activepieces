import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';

export const findSupplierAction = createAction({
	auth: workdayAuth,
	name: 'find_supplier',
	classification: 'READ',
	displayName: 'Find Supplier',
	description: 'Finds a supplier by ID in Workday using WQL.',
	audience: 'both',
	aiMetadata: {
		description:
			'Looks up a single supplier by its ID via a Workday Query Language (WQL) query against the suppliers dataset, returning the supplier and its name. Use to resolve or verify a supplier when you already have its ID. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		supplierId: Property.ShortText({
			displayName: 'Supplier ID',
			description: 'The ID of the supplier to find.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await workdayApi.findSupplier({ auth, supplierId: propsValue.supplierId });
	},
});
