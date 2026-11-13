import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiOutput } from '../../common/ai-props';
import { listDealStagesOutputSchema } from '../../common/output-schemas';

export const listDealStagesAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_list_deal_stages',
	classification: 'SEARCH',
	displayName: 'List Deal Stages',
	description: 'Lists the deal stages, optionally of one pipeline.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists deal stages with their ID, title, pipeline and order, optionally only for one pipeline from List Deal Pipelines. Use it to find the stage ID for Create Deal, Update Deal and List Deals. Read-only and safe to repeat.',
		idempotent: true,
	},
	outputSchema: listDealStagesOutputSchema,
	props: {
		pipeline_id: Property.ShortText({ displayName: 'Pipeline ID', description: 'Use List Deal Pipelines to find the ID.', required: false }),
	},
	async run({ auth, propsValue }) {
		const pipelineId = aiInput.optionalNumericId({ value: propsValue.pipeline_id, label: 'Pipeline ID' });
		const all = await makeClient(auth.props).listAll({ path: '/dealStages', key: 'dealStages', query: { 'filters[d_groupid]': pipelineId } });
		const items = all.items.map((record) => aiOutput.idText({ record, keys: ['id', 'title', 'group', 'order'] }));
		return { items, total: items.length };
	},
});
