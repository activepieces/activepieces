import { createAction } from '@activepieces/pieces-framework';

import { mauticListCompaniesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListCompaniesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_companies',
	outputSchema: mauticListCompaniesOutputSchema,
	displayName: 'List Companies',
	description: 'Lists Mautic companies.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists companies with paging, sorting and filters. Use Search for free text or commands like "companyname:Acme", or Where for exact column conditions. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'companies',
			key: 'companies',
			query: context.propsValue,
		});
	},
});
