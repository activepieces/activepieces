import { createAction } from '@activepieces/pieces-framework';

import { mauticGetCampaignEventOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetCampaignEventAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_campaign_event',
	outputSchema: mauticGetCampaignEventOutputSchema,
	displayName: 'Get Campaign Event',
	description: 'Gets one Mautic event by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets a single campaign event by id, with its type, trigger settings and properties.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Event Id',
			description: 'Numeric event id, from List Campaign Events or Get Campaign.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'campaigns/events',
			id: context.propsValue.id,
		});
	},
});
