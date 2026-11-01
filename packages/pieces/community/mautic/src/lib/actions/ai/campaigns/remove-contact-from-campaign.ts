import { createAction } from '@activepieces/pieces-framework';

import { mauticAdjustContactPointsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticRemoveContactFromCampaignAction = createAction({
	auth: mauticAuth,
	name: 'mautic_remove_contact_from_campaign',
	outputSchema: mauticAdjustContactPointsOutputSchema,
	displayName: 'Remove Contact from Campaign',
	description: 'Removes a contact from a Mautic campaign.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Removes a contact from a campaign manually; it stops receiving the campaign events. Repeating it leaves the contact out.',
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
			change: 'remove',
		});
	},
});
