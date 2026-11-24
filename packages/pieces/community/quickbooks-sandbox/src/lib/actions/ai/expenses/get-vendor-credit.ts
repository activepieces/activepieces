import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateVendorCreditOutputSchema } from '../../../output-schemas';

export const getVendorCreditAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_vendor_credit',
	outputSchema: quickbooksSandboxCreateVendorCreditOutputSchema,
	displayName: 'Get Vendor Credit',
	description: 'Gets one vendor credit by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one vendor credit with its lines, remaining balance and SyncToken. Get the id from List Vendor Credits or Create Vendor Credit.',
		idempotent: true,
	},
	props: {
		vendorCreditId: quickbooksAiProps.id({
			required: true,
			displayName: 'Vendor Credit ID',
			description: 'QuickBooks vendor credit id. Use List Vendor Credits to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'VendorCredit',
			id: context.propsValue.vendorCreditId,
		});
	},
});
