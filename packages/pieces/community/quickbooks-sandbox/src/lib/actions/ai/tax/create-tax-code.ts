import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksClient } from '../../../common/client';
import { quickbooksSandboxCreateTaxCodeOutputSchema } from '../../../output-schemas';

export const createTaxCodeAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_tax_code',
	outputSchema: quickbooksSandboxCreateTaxCodeOutputSchema,
	displayName: 'Create Tax Code',
	description: 'Creates a tax code with its tax rates.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a tax code and its tax rates in one call, through the tax service. Only for companies without automated sales tax. Each rate names an existing tax rate (from List Tax Rates) or a new one with a TaxAgencyId from List Tax Agencies or Create Tax Agency. Not idempotent: each call creates a new tax code.',
		idempotent: false,
	},
	props: {
		taxCode: Property.ShortText({
			displayName: 'Tax Code Name',
			description: 'Name of the new tax code, unique among tax codes.',
			required: true,
		}),
		taxRateDetails: Property.Json({
			displayName: 'Tax Rate Details',
			description:
				'JSON array of the rates in this code, e.g. [{"TaxRateName": "City Tax", "RateValue": "2.5", "TaxAgencyId": "1", "TaxApplicableOn": "Sales"}] for a new rate, or [{"TaxRateId": "3"}] for an existing one. TaxApplicableOn is Sales or Purchase.',
			required: true,
		}),
	},
	async run(context) {
		const { taxCode, taxRateDetails } = context.propsValue;
		if (!Array.isArray(taxRateDetails) || taxRateDetails.length === 0) {
			throw new Error('Tax Rate Details must be a non-empty JSON array of tax rate objects.');
		}
		return await quickbooksClient.request<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/taxservice/taxcode',
			body: { TaxCode: taxCode, TaxRateDetails: taxRateDetails },
		});
	},
});
