import { createAction } from '@activepieces/pieces-framework';

import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticExportCampaignAction = createAction({
	auth: mauticAuth,
	name: 'mautic_export_campaign',
	displayName: 'Export Campaign',
	description: 'Exports a Mautic campaign as JSON.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Exports a campaign with its events, segments, emails and forms as JSON, in the format Import Campaign takes. Needs Mautic 7 and the campaign export permission.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Campaign Id',
			description: 'Numeric campaign id, from List Campaigns or Create Campaign.',
		}),
	},
	async run(context) {
		return await mauticApi.exportCampaign({ auth: context.auth, id: context.propsValue.id });
	},
});
