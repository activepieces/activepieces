import {
	OAuth2PropertyValue,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { escapeWql, workdayWqlRequest } from '../common';

export const findSupplier = createAction({
	auth: workdayAuth,
	name: 'find_supplier',
	displayName: 'Find Supplier',
	description: 'Finds a supplier by ID in Workday using WQL.',
	props: {
		supplierId: Property.ShortText({
			displayName: 'Supplier ID',
			description: 'The ID of the supplier to find.',
			required: true,
		}),
	},
	async run(ctx) {
		const { supplierId } = ctx.propsValue;
		const response = await workdayWqlRequest(
			ctx.auth as OAuth2PropertyValue,
			`SELECT supplier, supplierName FROM suppliers WHERE supplier = '${escapeWql(supplierId)}'`,
		);
		return response.body;
	},
});
