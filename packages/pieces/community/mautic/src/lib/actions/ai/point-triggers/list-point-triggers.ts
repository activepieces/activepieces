import { createAction } from '@activepieces/pieces-framework';

import { mauticListPointTriggersOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListPointTriggersAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_point_triggers',
	outputSchema: mauticListPointTriggersOutputSchema,
	displayName: 'List Point Triggers',
	description: 'Lists Mautic point triggers.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists point triggers, which act when a contact reaches a score. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'points/triggers',
			key: 'triggers',
			query: context.propsValue,
		});
	},
});
