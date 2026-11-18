import { createAction } from '@activepieces/pieces-framework';

import { mauticListActivityOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListActivityAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_activity',
	outputSchema: mauticListActivityOutputSchema,
	displayName: 'List Activity',
	description: 'Lists activity events across all Mautic contacts.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists timeline events (page hits, email opens, form submissions, point changes and more) across all contacts, newest first by default. Filter by event type and date range; page with Page and Limit. Use List Contact Activity for a single contact.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.activityOptions,
	},
	async run(context) {
		return await mauticApi.listActivity({
			auth: context.auth,
			query: context.propsValue,
		});
	},
});
