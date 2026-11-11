import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiProps } from '../../common/ai-props';
import { addContactToAutomationAiOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const addContactToAutomationAiAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_add_contact_to_automation',
	classification: 'WRITE',
	displayName: 'Add Contact to Automation',
	description: 'Starts an automation for a contact.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Enrolls an existing contact (ID or email) in an automation from List Automations. An unknown email fails instead of creating a contact. Not safe to repeat: each call starts another run of the automation for the contact.',
		idempotent: false,
	},
	outputSchema: addContactToAutomationAiOutputSchema,
	props: {
		contact_id_or_email: aiProps.contactIdOrEmail(),
		automation_id: Property.ShortText({ displayName: 'Automation ID', description: 'Use List Automations to find the ID.', required: true }),
	},
	async run({ auth, propsValue }) {
		const client = makeClient(auth.props);
		const automationId = aiInput.numericId({ value: propsValue.automation_id, label: 'Automation ID' });
		const contactId = await aiInput.resolveContactId({ client, value: propsValue.contact_id_or_email, label: 'Contact ID or Email' });
		const response = await client.request({
			method: 'POST',
			path: '/contactAutomations',
			body: { contactAutomation: { contact: contactId, automation: automationId } },
		});
		const run = acData.recordAt({ value: response.body, key: 'contactAutomation' });
		return {
			contactAutomationId: acData.textAt({ value: run, key: 'id' }),
			contactId,
			automationId,
			status: acData.textAt({ value: run, key: 'status' }),
		};
	},
});
