import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateDepositOutputSchema } from '../../../output-schemas';

export const getDepositAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_deposit',
	outputSchema: quickbooksSandboxCreateDepositOutputSchema,
	displayName: 'Get Deposit',
	description: 'Gets one deposit by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Reads one deposit with its deposit-to account, lines, linked payments, total and SyncToken. Get the id from List Deposits or Create Deposit.',
		idempotent: true,
	},
	props: {
		depositId: quickbooksAiProps.id({
			required: true,
			displayName: 'Deposit ID',
			description: 'QuickBooks deposit id. Use List Deposits to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'Deposit',
			id: context.propsValue.depositId,
		});
	},
});
