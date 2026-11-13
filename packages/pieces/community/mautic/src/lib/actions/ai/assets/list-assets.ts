import { createAction } from '@activepieces/pieces-framework';

import { mauticListAssetsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListAssetsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_assets',
	outputSchema: mauticListAssetsOutputSchema,
	displayName: 'List Assets',
	description: 'Lists Mautic assets.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists assets (downloadable files) with their download counts. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'assets',
			key: 'assets',
			query: context.propsValue,
		});
	},
});
