import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { applyLeadAssignmentRulesOutputSchema } from '../../output-schemas';

export const applyLeadAssignmentRules = createAction({
	auth: salesforceAuth,
	name: 'apply_lead_assignment_rules',
	classification: 'WRITE',
	displayName: 'Apply Lead Assignment Rules',
	description: "Re-run the org's active lead assignment rule on a lead.",
	audience: 'ai',
	aiMetadata: {
		description:
			"Runs the org's active lead assignment rule on an existing Lead so it gets routed to the right owner or queue, and reports the owner before and after. Use it after Create Lead or Update Lead when ownership should follow the org's routing; to set an owner directly use Update Lead with Owner ID. Needs an active lead assignment rule in the org, otherwise the owner does not change. Safe to retry.",
		idempotent: true,
	},
	outputSchema: applyLeadAssignmentRulesOutputSchema,
	props: {
		lead_id: Property.ShortText({ displayName: 'Lead ID', required: true }),
	},
	async run(context) {
		const id = salesforceUtils.assertId({ value: context.propsValue.lead_id, fieldName: 'Lead ID' });
		const before = await getLead({ auth: context.auth, id });
		await callSalesforceApi(
			HttpMethod.PATCH,
			context.auth,
			`/services/data/v56.0/sobjects/Lead/${id}`,
			{ Status: before.Status },
			{ headers: { 'Sforce-Auto-Assign': 'TRUE' } }
		);
		const after = await getLead({ auth: context.auth, id });
		return {
			id,
			previous_owner_id: before.OwnerId,
			owner_id: after.OwnerId,
			reassigned: before.OwnerId !== after.OwnerId,
		};
	},
});

async function getLead({ auth, id }: { auth: OAuth2PropertyValue; id: string }) {
	const response = await callSalesforceApi<LeadOwnerRecord>(
		HttpMethod.GET,
		auth,
		`/services/data/v56.0/sobjects/Lead/${id}?fields=Status,OwnerId`,
		undefined
	);
	return response.body;
}

type LeadOwnerRecord = {
	Status: string;
	OwnerId: string;
};
