import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { activeCampaignApi } from '../../common/client';
import { aiInput, aiOutput } from '../../common/ai-props';
import { dealAiOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const getDealAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_get_deal',
	classification: 'READ',
	displayName: 'Get Deal',
	description: 'Gets a deal.',
	audience: 'ai',
	aiMetadata: {
		description: 'Reads one deal by ID: title, value, currency, status, pipeline, stage, owner, contact and account. Find the ID with List Deals. Read-only and safe to repeat.',
		idempotent: true,
	},
	outputSchema: dealAiOutputSchema,
	props: {
		deal_id: Property.ShortText({ displayName: 'Deal ID', description: 'Use List Deals to find the ID.', required: true }),
	},
	async run({ auth, propsValue }) {
		const dealId = aiInput.numericId({ value: propsValue.deal_id, label: 'Deal ID' });
		const body = await makeClient(auth.props).get({ path: `/deals/${activeCampaignApi.segment(dealId)}` });
		return { deal: aiOutput.dealSummary(acData.recordAt({ value: body, key: 'deal' })) };
	},
});
