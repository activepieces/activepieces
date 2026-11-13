import { Property, createAction } from '@activepieces/pieces-framework';

import { mauticGetStatsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetStatsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_stats',
	outputSchema: mauticGetStatsOutputSchema,
	displayName: 'Get Stats',
	description: 'Reads raw rows from a Mautic stats table.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Reads raw rows from a Mautic stats table, e.g. "email_stats", "page_hits", "form_submissions", "lead_points_change_log", "campaign_lead_event_log". Leave Table empty to list the available tables and their columns. Filter with Where; page with Start and Limit. Each table needs its own view permission.',
		idempotent: true,
	},
	props: {
		table: Property.ShortText({
			displayName: 'Table',
			description: 'Stats table name; leave empty to list the tables.',
			required: false,
		}),
		start: mauticAiProps.pageOptions.start,
		limit: mauticAiProps.pageOptions.limit,
		where: mauticAiProps.listOptions.where,
	},
	async run(context) {
		return await mauticApi.getStats({
			auth: context.auth,
			table: context.propsValue.table,
			query: context.propsValue,
		});
	},
});
