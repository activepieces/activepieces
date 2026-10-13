import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteCampaignOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteCampaignAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_campaign',
	outputSchema: mauticDeleteCampaignOutputSchema,
	displayName: 'Delete Campaign',
	description: 'Permanently deletes a Mautic campaign.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a campaign and its event history. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Campaign Id',
			description: 'Numeric campaign id, from List Campaigns or Create Campaign.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'campaigns',
			id: context.propsValue.id,
		});
	},
});
