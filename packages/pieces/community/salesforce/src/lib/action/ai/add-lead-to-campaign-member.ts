import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { addLeadToCampaignMemberOutputSchema } from '../../output-schemas';

export const addLeadToCampaignMember = createAction({
	auth: salesforceAuth,
	name: 'add_lead_to_campaign_member',
	classification: 'WRITE',
	displayName: 'Add Lead to Campaign',
	description: 'Add an existing lead to a campaign as a member.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Enrolls an existing Lead in a Campaign by creating a CampaignMember, with an optional member status (e.g. Sent or Responded; defaults to the campaign default). Use Add Contact to Campaign for contacts and Remove Campaign Member to take it out. Not idempotent: Salesforce rejects the call if the lead is already a member of that campaign.',
		idempotent: false,
	},
	outputSchema: addLeadToCampaignMemberOutputSchema,
	props: {
		campaign_id: Property.ShortText({ displayName: 'Campaign ID', required: true }),
		lead_id: Property.ShortText({ displayName: 'Lead ID', required: true }),
		status: Property.ShortText({ displayName: 'Member Status', description: 'Campaign member status, e.g. Sent. Leave empty for the default.', required: false }),
	},
	async run(context) {
		const { campaign_id, lead_id, status } = context.propsValue;
		const result = await crmUtils.createRecord({
			auth: context.auth,
			object: 'CampaignMember',
			fields: { CampaignId: campaign_id, LeadId: lead_id, Status: status },
			additionalFields: undefined,
		});
		return { ...result, campaign_id, lead_id };
	},
});
