import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListOrganizationsOutputSchema } from '../../../output-schemas';

export const listOrganizationsAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_organizations',
	outputSchema: zohoInvoiceListOrganizationsOutputSchema,
	displayName: 'List Organizations',
	description: 'Lists the Zoho Invoice organizations the connected user belongs to.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every Zoho Invoice organization the connected user can access, with organization_id, name, currency and is_default_org. Call this first: every other Zoho Invoice action needs an Organization ID.',
		idempotent: true,
	},
	props: {},
	async run({ auth }) {
		return await zohoInvoiceApi.listOrganizations({ auth });
	},
});
