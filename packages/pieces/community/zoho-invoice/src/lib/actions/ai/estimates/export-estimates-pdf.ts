import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceGetInvoiceAttachmentOutputSchema } from '../../../output-schemas';

export const exportEstimatesPdfAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_export_estimates_pdf',
	outputSchema: zohoInvoiceGetInvoiceAttachmentOutputSchema,
	displayName: 'Export Estimates as PDF',
	description: 'Exports one or more estimates as a single PDF file.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Renders the given estimates into one PDF file and returns it as a file reference that later steps can attach or upload. Use List Estimates to find the IDs.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		estimateIds: Property.Array({
			displayName: 'Estimate IDs',
			description: 'IDs of the estimates to export. Use List Estimates to find them.',
			required: true,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		const estimateIds = propsValue.estimateIds;
		if (
			estimateIds.length === 0 ||
			!estimateIds.every((id): id is string => typeof id === 'string' && id !== '')
		) {
			throw new Error('Estimate IDs must be a non-empty list of estimate ID strings.');
		}
		const content = await zohoInvoiceApi.exportEstimatesPdf({
			auth,
			organizationId: propsValue.organizationId,
			estimateIds,
		});
		const fileName = 'estimates.pdf';
		const file = await context.files.write({ fileName, data: Buffer.from(content) });
		return { file, fileName };
	},
});
