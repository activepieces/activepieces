import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateTaxAgencyOutputSchema } from '../../../output-schemas';

export const getTaxAgencyAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_tax_agency',
	outputSchema: quickbooksSandboxCreateTaxAgencyOutputSchema,
	displayName: 'Get Tax Agency',
	description: 'Gets one tax agency by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Reads one tax agency (the authority sales tax is paid to) with its SyncToken. Get the id from List Tax Agencies or Create Tax Agency.',
		idempotent: true,
	},
	props: {
		taxAgencyId: quickbooksAiProps.id({
			required: true,
			displayName: 'Tax Agency ID',
			description: 'QuickBooks tax agency id. Use List Tax Agencies to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'TaxAgency',
			id: context.propsValue.taxAgencyId,
		});
	},
});
