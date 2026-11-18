import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetAccountOutputSchema } from '../../../output-schemas';

export const getAccountAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_account',
	outputSchema: quickbooksSandboxGetAccountOutputSchema,
	displayName: 'Get Account',
	description: 'Gets one account by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one account with its type, sub-type, current balance and SyncToken. Get the id from List Accounts or Create Account.',
		idempotent: true,
	},
	props: {
		accountId: quickbooksAiProps.id({
			required: true,
			displayName: 'Account ID',
			description: 'QuickBooks account id. Use List Accounts to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'Account',
			id: context.propsValue.accountId,
		});
	},
});
