import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { activeCampaignApi } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { removeContactFromAutomationOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const removeContactFromAutomationAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_remove_contact_from_automation',
	classification: 'DESTRUCTIVE',
	displayName: 'Remove Contact from Automation',
	description: 'Ends a contact\'s active runs of an automation.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Ends the contact\'s in-progress runs of one automation (contact by ID or email, automation from List Automations); completed runs are left alone. Safe to repeat: when the contact has no active run, nothing changes and removed is false.',
		idempotent: true,
	},
	outputSchema: removeContactFromAutomationOutputSchema,
	props: {
		contact_id_or_email: aiProps.contactIdOrEmail(),
		automation_id: Property.ShortText({ displayName: 'Automation ID', description: 'Use List Automations to find the ID.', required: true }),
	},
	async run({ auth, propsValue }) {
		const client = makeClient(auth.props);
		const automationId = aiInput.numericId({ value: propsValue.automation_id, label: 'Automation ID' });
		const contactId = await aiInput.resolveContactId({ client, value: propsValue.contact_id_or_email, label: 'Contact ID or Email' });
		const runs = await client.listAll({ path: `/contacts/${activeCampaignApi.segment(contactId)}/contactAutomations`, key: 'contactAutomations' });
		const activeIds = runs.items
			.filter((run) => acData.textAt({ value: run, key: 'automation' }) === automationId && acData.textAt({ value: run, key: 'status' }) === '1')
			.map((run) => acData.textAt({ value: run, key: 'id' }))
			.filter((id): id is string => id !== undefined);
		const removedIds: string[] = [];
		for (const id of activeIds) {
			if (await client.deleteIgnoringMissing({ path: `/contactAutomations/${activeCampaignApi.segment(id)}` })) {
				removedIds.push(id);
			}
		}
		return { removed: removedIds.length > 0, contactId, automationId, contactAutomationIds: removedIds };
	},
});
