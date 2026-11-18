import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetCreditMemoPdfOutputSchema } from '../../../output-schemas';

export const getEstimatePdfAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_estimate_pdf',
	outputSchema: quickbooksSandboxGetCreditMemoPdfOutputSchema,
	displayName: 'Get Estimate PDF',
	description: 'Downloads an estimate as a PDF file.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Downloads one estimate as a PDF and returns it as a file reference. Get the id from List Estimates.',
		idempotent: true,
	},
	props: {
		estimateId: quickbooksAiProps.id({
			required: true,
			displayName: 'Estimate ID',
			description: 'QuickBooks estimate id. Use List Estimates to find it.',
		}),
	},
	async run(context) {
		const { estimateId } = context.propsValue;
		const data = await quickbooksApi.downloadPdf({ auth: context.auth, entity: 'Estimate', id: estimateId });
		const fileName = `estimate-${estimateId}.pdf`;
		const file = await context.files.write({ fileName, data });
		return { file, fileName };
	},
});
