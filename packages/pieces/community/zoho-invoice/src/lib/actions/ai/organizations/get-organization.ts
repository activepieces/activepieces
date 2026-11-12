import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceGetOrganizationOutputSchema } from '../../../output-schemas';

export const getOrganizationAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_organization',
	outputSchema: zohoInvoiceGetOrganizationOutputSchema,
	displayName: 'Get Organization',
	description: 'Gets the details of one Zoho Invoice organization.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one organization by ID: name, contact details, address, base currency, time zone, fiscal year and date format. Use List Organizations to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getOrganization({
			auth,
			organizationId: propsValue.organizationId,
		});
	},
});
