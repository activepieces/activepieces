import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateTaxAgencyOutputSchema } from '../../../output-schemas';

export const createTaxAgencyAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_tax_agency',
	outputSchema: quickbooksSandboxCreateTaxAgencyOutputSchema,
	displayName: 'Create Tax Agency',
	description: 'Creates a tax agency.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a tax agency, the authority sales tax is paid to, for use as the TaxAgencyId in Create Tax Code. US companies with automated sales tax only show system-created agencies, so check List Tax Agencies first. Not idempotent: each call creates a new agency.',
		idempotent: false,
	},
	props: {
		displayName: Property.ShortText({
			displayName: 'Name',
			description: 'Name of the tax agency, unique among tax agencies.',
			required: true,
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { displayName, additionalFields } = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'TaxAgency',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({ fields: { DisplayName: displayName } }),
			},
		});
	},
});
