import { createAction, Property } from '@activepieces/pieces-framework';

import { facebookLeadsAuth } from '../../auth';
import { facebookLeadsApi } from '../../common/api';
import { facebookLeadsUtils } from '../../common/utils';
import { facebookLeadsGetLeadOutputSchema } from '../../output-schemas';

export const getLeadAction = createAction({
	auth: facebookLeadsAuth,
	name: 'facebook_leads_get_lead',
	outputSchema: facebookLeadsGetLeadOutputSchema,
	displayName: 'Get Lead',
	description: 'Gets one lead by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one lead by ID with its answers keyed by question, its form and its ad, ad set and campaign. Lead IDs come from List Leads or the New Lead trigger. Leads older than 90 days are no longer returned by Facebook.',
		idempotent: true,
	},
	props: {
		leadId: Property.ShortText({
			displayName: 'Lead ID',
			description: 'Lead ID, e.g. "987654321098765". Use List Leads to find it.',
			required: true,
		}),
	},
	async run(context) {
		const lead = await facebookLeadsApi.getLead({
			leadId: context.propsValue.leadId,
			accessToken: context.auth.access_token,
		});
		return facebookLeadsUtils.transformLeadData({ lead });
	},
});
