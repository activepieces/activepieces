import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeleteVendorCreditOutputSchema } from '../../../output-schemas';

export const deleteVendorCreditAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_vendor_credit',
	outputSchema: quickbooksSandboxDeleteVendorCreditOutputSchema,
	displayName: 'Delete Vendor Credit',
	description: 'Permanently deletes a vendor credit.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one vendor credit; it cannot be restored. Reads the latest SyncToken first. Get the id from List Vendor Credits.',
		idempotent: false,
	},
	props: {
		vendorCreditId: quickbooksAiProps.id({
			required: true,
			displayName: 'Vendor Credit ID',
			description: 'QuickBooks vendor credit id. Use List Vendor Credits to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'VendorCredit',
			id: context.propsValue.vendorCreditId,
		});
	},
});
