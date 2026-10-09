import { createAction } from '@activepieces/pieces-framework';

import { mauticListCampaignContactsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListCampaignContactsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_campaign_contacts',
	outputSchema: mauticListCampaignContactsOutputSchema,
	displayName: 'List Campaign Contacts',
	description: 'Lists the contacts in a Mautic campaign.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the contacts in a campaign with their membership dates (contact ids, not full records; use Get Contact for details). Page with Start and Limit.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Campaign Id',
			description: 'Numeric campaign id, from List Campaigns or Create Campaign.',
		}),
		start: mauticAiProps.pageOptions.start,
		limit: mauticAiProps.pageOptions.limit,
		where: mauticAiProps.listOptions.where,
	},
	async run(context) {
		return await mauticApi.listCampaignContacts({
			auth: context.auth,
			id: context.propsValue.id,
			query: context.propsValue,
		});
	},
});
