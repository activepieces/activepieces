import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateVendorOutputSchema } from '../../../output-schemas';

export const getVendorAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_vendor',
	outputSchema: quickbooksSandboxCreateVendorOutputSchema,
	displayName: 'Get Vendor',
	description: 'Gets one vendor by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Reads one vendor with its contact details, addresses, balance and SyncToken. Get the id from List Vendors or Create Vendor.',
		idempotent: true,
	},
	props: {
		vendorId: quickbooksAiProps.id({
			required: true,
			displayName: 'Vendor ID',
			description: 'QuickBooks vendor id. Use List Vendors to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'Vendor',
			id: context.propsValue.vendorId,
		});
	},
});
