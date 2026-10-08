import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { addContactToCampaignMemberOutputSchema } from '../../output-schemas';

export const addContactToCampaignMember = createAction({
	auth: salesforceAuth,
	name: 'add_contact_to_campaign_member',
	classification: 'WRITE',
	displayName: 'Add Contact to Campaign',
	description: 'Add an existing contact to a campaign as a member.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Enrolls an existing Contact in a Campaign by creating a CampaignMember, with an optional member status (e.g. Sent or Responded; defaults to the campaign default). Use Add Lead to Campaign for leads and Remove Campaign Member to take it out. Not idempotent: Salesforce rejects the call if the contact is already a member of that campaign.',
		idempotent: false,
	},
	outputSchema: addContactToCampaignMemberOutputSchema,
	props: {
		campaign_id: Property.ShortText({ displayName: 'Campaign ID', required: true }),
		contact_id: Property.ShortText({ displayName: 'Contact ID', required: true }),
		status: Property.ShortText({ displayName: 'Member Status', description: 'Campaign member status, e.g. Sent. Leave empty for the default.', required: false }),
	},
	async run(context) {
		const { campaign_id, contact_id, status } = context.propsValue;
		const result = await crmUtils.createRecord({
			auth: context.auth,
			object: 'CampaignMember',
			fields: { CampaignId: campaign_id, ContactId: contact_id, Status: status },
			additionalFields: undefined,
		});
		return { ...result, campaign_id, contact_id };
	},
});
