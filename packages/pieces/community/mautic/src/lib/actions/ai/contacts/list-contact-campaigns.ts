import { createAction } from '@activepieces/pieces-framework';

import { mauticListContactCampaignsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListContactCampaignsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_contact_campaigns',
	outputSchema: mauticListContactCampaignsOutputSchema,
	displayName: 'List Contact Campaigns',
	description: 'Lists the campaigns of a Mautic contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the campaigns a contact is a member of, with the date added and whether membership was manual.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts or Create Contact.',
		}),
	},
	async run(context) {
		return await mauticApi.listContactRelation({
			auth: context.auth,
			id: context.propsValue.id,
			relation: 'campaigns',
		});
	},
});
