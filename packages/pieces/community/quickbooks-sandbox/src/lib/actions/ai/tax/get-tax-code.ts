import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetTaxCodeOutputSchema } from '../../../output-schemas';

export const getTaxCodeAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_tax_code',
	outputSchema: quickbooksSandboxGetTaxCodeOutputSchema,
	displayName: 'Get Tax Code',
	description: 'Gets one tax code by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Reads one tax code with its sales and purchase tax rate lists. Get the id from List Tax Codes or Create Tax Code (TaxCodeId).',
		idempotent: true,
	},
	props: {
		taxCodeId: quickbooksAiProps.id({
			required: true,
			displayName: 'Tax Code ID',
			description: 'QuickBooks tax code id. Use List Tax Codes to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'TaxCode',
			id: context.propsValue.taxCodeId,
		});
	},
});
