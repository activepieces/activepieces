import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetCreditMemoPdfOutputSchema } from '../../../output-schemas';

export const getCreditMemoPdfAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_credit_memo_pdf',
	outputSchema: quickbooksSandboxGetCreditMemoPdfOutputSchema,
	displayName: 'Get Credit Memo PDF',
	description: 'Downloads a credit memo as a PDF file.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Downloads one credit memo as a PDF and returns it as a file reference. Get the id from List Credit Memos.',
		idempotent: true,
	},
	props: {
		creditMemoId: quickbooksAiProps.id({
			required: true,
			displayName: 'Credit Memo ID',
			description: 'QuickBooks credit memo id. Use List Credit Memos to find it.',
		}),
	},
	async run(context) {
		const { creditMemoId } = context.propsValue;
		const data = await quickbooksApi.downloadPdf({ auth: context.auth, entity: 'CreditMemo', id: creditMemoId });
		const fileName = `credit-memo-${creditMemoId}.pdf`;
		const file = await context.files.write({ fileName, data });
		return { file, fileName };
	},
});
