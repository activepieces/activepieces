import { createAction } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiApi } from '../../common/api';

export const listMonitorsAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_list_monitors',
	displayName: 'List Monitors',
	description: 'Lists all monitors on the account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns every monitor on the account with its `cronId`, status (active or paused), schedule and config. Takes no filters or paging.',
		idempotent: true,
	},
	props: {},
	async run({ auth }) {
		const monitors = await scrapegraphaiApi.listMonitors({ auth });
		return { monitors, count: monitors.length };
	},
});
