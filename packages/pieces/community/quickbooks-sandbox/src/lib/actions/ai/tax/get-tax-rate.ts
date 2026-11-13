import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetTaxRateOutputSchema } from '../../../output-schemas';

export const getTaxRateAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_tax_rate',
	outputSchema: quickbooksSandboxGetTaxRateOutputSchema,
	displayName: 'Get Tax Rate',
	description: 'Gets one tax rate by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Reads one tax rate with its percentage and tax agency. Get the id from List Tax Rates or Create Tax Code (TaxRateDetails[].TaxRateId).',
		idempotent: true,
	},
	props: {
		taxRateId: quickbooksAiProps.id({
			required: true,
			displayName: 'Tax Rate ID',
			description: 'QuickBooks tax rate id. Use List Tax Rates to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'TaxRate',
			id: context.propsValue.taxRateId,
		});
	},
});
