import { createAction } from '@activepieces/pieces-framework';

import { mauticAdjustContactPointsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticAddContactToCampaignAction = createAction({
	auth: mauticAuth,
	name: 'mautic_add_contact_to_campaign',
	outputSchema: mauticAdjustContactPointsOutputSchema,
	displayName: 'Add Contact to Campaign',
	description: 'Adds a contact to a Mautic campaign.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a contact to a campaign manually, so it starts receiving the campaign events. Repeating it leaves the contact in the campaign.',
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
	},
	async run(context) {
		return await mauticApi.changeMembership({
			auth: context.auth,
			resource: 'campaigns',
			id: context.propsValue.id,
			contactId: context.propsValue.contactId,
			change: 'add',
		});
	},
});
