import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxSendCreditMemoOutputSchema } from '../../../output-schemas';

export const sendCreditMemoAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_send_credit_memo',
	outputSchema: quickbooksSandboxSendCreditMemoOutputSchema,
	displayName: 'Send Credit Memo',
	description: 'Emails a credit memo to the customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Emails one credit memo as a PDF, to Send To or, when empty, to the billing email on the credit memo. Each call sends another email. Get the id from List Credit Memos.',
		idempotent: false,
	},
	props: {
		creditMemoId: quickbooksAiProps.id({
			required: true,
			displayName: 'Credit Memo ID',
			description: 'QuickBooks credit memo id. Use List Credit Memos to find it.',
		}),
		sendTo: quickbooksAiProps.sendTo({ required: false }),
	},
	async run(context) {
		return await quickbooksApi.sendEntity({
			auth: context.auth,
			entity: 'CreditMemo',
			id: context.propsValue.creditMemoId,
			sendTo: context.propsValue.sendTo,
		});
	},
});
