import { createAction } from '@activepieces/pieces-framework';

import { mauticCloneCampaignOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCloneCampaignAction = createAction({
	auth: mauticAuth,
	name: 'mautic_clone_campaign',
	outputSchema: mauticCloneCampaignOutputSchema,
	displayName: 'Clone Campaign',
	description: 'Copies a Mautic campaign.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an unpublished copy of a campaign with the same events. Each call makes another copy. Returns the new campaign.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Campaign Id',
			description: 'Numeric campaign id, from List Campaigns or Create Campaign.',
		}),
	},
	async run(context) {
		return await mauticApi.cloneCampaign({ auth: context.auth, id: context.propsValue.id });
	},
});
