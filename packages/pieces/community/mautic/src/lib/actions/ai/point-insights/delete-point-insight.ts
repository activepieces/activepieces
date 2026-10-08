import { createAction } from '@activepieces/pieces-framework';

import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeletePointInsightAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_point_insight',
	displayName: 'Delete Point Insight',
	description: 'Permanently deletes a Mautic point insight.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a point insight. Needs Mautic 7. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Point Insight Id',
			description: 'Numeric point insight id, from List Point Insights or Create Point Insight.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'points/insights',
			id: context.propsValue.id,
		});
	},
});
