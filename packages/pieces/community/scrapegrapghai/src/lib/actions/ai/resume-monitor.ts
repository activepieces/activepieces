import { createAction } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiAiProps } from '../../common/ai-props';
import { scrapegraphaiApi } from '../../common/api';

export const resumeMonitorAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_resume_monitor',
	displayName: 'Resume Monitor',
	description: 'Resumes a paused monitor.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Puts a paused monitor back on its schedule immediately.',
		idempotent: true,
	},
	props: {
		monitorId: scrapegraphaiAiProps.monitorId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.resumeMonitor({ auth, monitorId: propsValue.monitorId });
	},
});
