import { createAction } from '@activepieces/pieces-framework';

import { mauticListCampaignContactEventsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListCampaignContactEventsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_campaign_contact_events',
	outputSchema: mauticListCampaignContactEventsOutputSchema,
	displayName: 'List Campaign Contact Events',
	description: 'Lists the events of one Mautic campaign for a contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the events of one campaign that a contact has been through or is scheduled for, with the log of each and the contact's membership.",
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Campaign Id',
			description: 'Numeric campaign id, from List Campaigns or Create Campaign.',
		}),
		contactId: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts.',
		}),
		...mauticAiProps.pageOptions,
	},
	async run(context) {
		return await mauticApi.listContactCampaignEvents({
			auth: context.auth,
			campaignId: context.propsValue.id,
			contactId: context.propsValue.contactId,
			query: context.propsValue,
		});
	},
});
