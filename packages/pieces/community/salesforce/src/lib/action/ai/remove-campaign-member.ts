import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { crmUtils } from '../../common/crm';
import { salesforceUtils } from '../../common/utils';
import { deletedRecordOutputSchema } from '../../output-schemas';

export const removeCampaignMember = createAction({
	auth: salesforceAuth,
	name: 'remove_campaign_member',
	classification: 'DESTRUCTIVE',
	displayName: 'Remove Campaign Member',
	description: 'Remove a lead or contact from a campaign.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Removes a Lead or Contact from a Campaign by deleting its CampaignMember record; give the campaign id and exactly one of lead id or contact id. The lead or contact itself is not deleted. Use Add Lead to Campaign / Add Contact to Campaign to enroll again. Reports deleted: false when it is not a member. Not idempotent: it deletes a record.',
		idempotent: false,
	},
	outputSchema: deletedRecordOutputSchema,
	props: {
		campaign_id: Property.ShortText({ displayName: 'Campaign ID', required: true }),
		lead_id: Property.ShortText({ displayName: 'Lead ID', description: 'Give this or Contact ID.', required: false }),
		contact_id: Property.ShortText({ displayName: 'Contact ID', description: 'Give this or Lead ID.', required: false }),
	},
	async run(context) {
		const { campaign_id, lead_id, contact_id } = context.propsValue;
		const memberIndex = crmUtils.exactlyOne({ values: [lead_id, contact_id], fieldNames: 'Lead ID or Contact ID' });
		const campaignId = salesforceUtils.assertId({ value: campaign_id, fieldName: 'Campaign ID' });
		const memberId = salesforceUtils.assertId({ value: (memberIndex === 0 ? lead_id : contact_id) ?? '', fieldName: memberIndex === 0 ? 'Lead ID' : 'Contact ID' });
		const memberField = memberIndex === 0 ? 'LeadId' : 'ContactId';
		const result = await crmUtils.query({
			auth: context.auth,
			soql: `SELECT Id FROM CampaignMember WHERE CampaignId = '${campaignId}' AND ${memberField} = '${memberId}' LIMIT 1`,
		});
		const member = result.records[0];
		if (!salesforceUtils.isRecord(member) || typeof member['Id'] !== 'string') {
			return { deleted: false, reason: 'Not a member of this campaign.' };
		}
		const id = salesforceUtils.assertId({ value: member['Id'], fieldName: 'Campaign Member ID' });
		await callSalesforceApi(HttpMethod.DELETE, context.auth, `/services/data/v56.0/sobjects/CampaignMember/${id}`, undefined);
		return { id, deleted: true };
	},
});
