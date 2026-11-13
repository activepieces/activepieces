import { createAction } from '@activepieces/pieces-framework';

import { mauticGetCampaignOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetCampaignAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_campaign',
	outputSchema: mauticGetCampaignOutputSchema,
	displayName: 'Get Campaign',
	description: 'Gets one Mautic campaign by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single campaign by its numeric id, with its events, segments and forms.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Campaign Id',
			description: 'Numeric campaign id, from List Campaigns or Create Campaign.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'campaigns',
			id: context.propsValue.id,
		});
	},
});
