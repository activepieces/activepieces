import { createAction } from '@activepieces/pieces-framework';

import { mauticListPointActionsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListPointActionsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_point_actions',
	outputSchema: mauticListPointActionsOutputSchema,
	displayName: 'List Point Actions',
	description: 'Lists Mautic point actions.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists point actions, the rules that give contacts points for what they do. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'points',
			key: 'points',
			query: context.propsValue,
		});
	},
});
