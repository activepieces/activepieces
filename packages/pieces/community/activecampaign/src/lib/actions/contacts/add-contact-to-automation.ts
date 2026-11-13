import { createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { activecampaignCommon, makeClient } from '../../common';
import { rawContactAutomationOutputSchema } from '../../common/output-schemas';

export const addContactToAutomationAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_add_contact_to_automation_human',
	classification: 'WRITE',
	displayName: 'Add Contact to Automation',
	description: 'Starts an automation for a contact. Each run of this step starts another run of the automation.',
	audience: 'human',
	aiMetadata: {
		description: 'Enrolls a contact in an automation. Not safe to repeat: each call starts another run of the automation for the contact.',
		idempotent: false,
	},
	outputSchema: rawContactAutomationOutputSchema,
	props: {
		contactId: activecampaignCommon.contactId,
		automationId: activecampaignCommon.automationId,
	},
	async run({ auth, propsValue }) {
		const response = await makeClient(auth.props).request({
			method: 'POST',
			path: '/contactAutomations',
			body: { contactAutomation: { contact: propsValue.contactId, automation: propsValue.automationId } },
		});
		return response.body;
	},
});
