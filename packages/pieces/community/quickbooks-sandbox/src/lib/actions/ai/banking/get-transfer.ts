import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateTransferOutputSchema } from '../../../output-schemas';

export const getTransferAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_transfer',
	outputSchema: quickbooksSandboxCreateTransferOutputSchema,
	displayName: 'Get Transfer',
	description: 'Gets one transfer by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Reads one transfer with its from and to accounts, amount and SyncToken. Get the id from List Transfers or Create Transfer.',
		idempotent: true,
	},
	props: {
		transferId: quickbooksAiProps.id({
			required: true,
			displayName: 'Transfer ID',
			description: 'QuickBooks transfer id. Use List Transfers to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'Transfer',
			id: context.propsValue.transferId,
		});
	},
});
