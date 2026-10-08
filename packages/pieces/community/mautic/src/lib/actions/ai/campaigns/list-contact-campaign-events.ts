import { createAction } from '@activepieces/pieces-framework';

import { mauticListContactCampaignEventsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListContactCampaignEventsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_contact_campaign_events',
	outputSchema: mauticListContactCampaignEventsOutputSchema,
	displayName: 'List Contact Campaign Events',
	description: 'Lists the campaign events of a Mautic contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every campaign event a contact has been through or is scheduled for, across all campaigns, with the log of each. Use List Campaign Contact Events for one campaign.',
		idempotent: true,
	},
	props: {
		contactId: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts.',
		}),
		...mauticAiProps.pageOptions,
	},
	async run(context) {
		return await mauticApi.listContactCampaignEvents({
			auth: context.auth,
			contactId: context.propsValue.contactId,
			query: context.propsValue,
		});
	},
});
