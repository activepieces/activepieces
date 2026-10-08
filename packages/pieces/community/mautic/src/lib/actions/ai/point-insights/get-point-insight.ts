import { createAction } from '@activepieces/pieces-framework';

import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetPointInsightAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_point_insight',
	displayName: 'Get Point Insight',
	description: 'Gets one Mautic point insight by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single point insight by its numeric id. Needs Mautic 7.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Point Insight Id',
			description: 'Numeric point insight id, from List Point Insights or Create Point Insight.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'points/insights',
			id: context.propsValue.id,
		});
	},
});
