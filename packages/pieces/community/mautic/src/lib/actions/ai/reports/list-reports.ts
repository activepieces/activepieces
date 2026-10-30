import { createAction } from '@activepieces/pieces-framework';

import { mauticListReportsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListReportsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_reports',
	outputSchema: mauticListReportsOutputSchema,
	displayName: 'List Reports',
	description: 'Lists Mautic reports.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists saved reports with their source, columns and filters. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'reports',
			key: 'reports',
			query: context.propsValue,
		});
	},
});
