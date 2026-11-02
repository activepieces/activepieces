import { createAction } from '@activepieces/pieces-framework';

import { mauticListDashboardWidgetTypesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticApi } from '../../../common/api';

export const mauticListDashboardWidgetTypesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_dashboard_widget_types',
	outputSchema: mauticListDashboardWidgetTypesOutputSchema,
	displayName: 'List Dashboard Widget Types',
	description: 'Lists the Mautic dashboard widget types.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the dashboard widget types (e.g. "created.leads.in.time", "emails.in.time", "page.hits.in.time") whose data Get Dashboard Widget Data returns.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await mauticApi.getDashboardData({ auth: context.auth });
	},
});
