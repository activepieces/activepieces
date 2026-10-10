import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiAiProps } from '../../common/ai-props';
import { scrapegraphaiApi } from '../../common/api';
import { scrapegrapghaiListMonitorActivityOutputSchema } from '../../output-schemas';

export const listMonitorActivityAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_list_monitor_activity',
	outputSchema: scrapegrapghaiListMonitorActivityOutputSchema,
	displayName: 'List Monitor Activity',
	description: "Lists a monitor's recent runs with change flags.",
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Returns a monitor's recent runs, newest first, each with status, duration, whether the page changed and per-format diffs. Each run `id` can be passed to Get History Entry for the captured content. Pass `nextCursor` as Cursor for older runs.",
		idempotent: true,
	},
	props: {
		monitorId: scrapegraphaiAiProps.monitorId({ required: true }),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Runs to return, 1-100. Defaults to 20.',
			required: false,
		}),
		cursor: Property.ShortText({
			displayName: 'Cursor',
			description: 'The `nextCursor` timestamp from the previous call, to fetch older runs.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.listMonitorActivity({
			auth,
			monitorId: propsValue.monitorId,
			limit: propsValue.limit,
			cursor: propsValue.cursor,
		});
	},
});
