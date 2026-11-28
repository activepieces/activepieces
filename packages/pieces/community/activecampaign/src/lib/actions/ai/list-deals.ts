import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiOutput, aiProps } from '../../common/ai-props';
import { DEAL_STATUS_CODES } from '../../common/constants';
import { listDealsOutputSchema } from '../../common/output-schemas';

export const listDealsAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_list_deals',
	classification: 'SEARCH',
	displayName: 'List Deals',
	description: 'Lists or searches deals.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Searches deals by text (title, contact or organization), pipeline, stage, status or owner, one page at a time. Values are in cents in value and as a decimal in valueFormatted. Use Get Deal for one deal. Read-only and safe to repeat.',
		idempotent: true,
	},
	outputSchema: listDealsOutputSchema,
	props: {
		search: Property.ShortText({ displayName: 'Search', description: 'Matches the deal title, contact or organization.', required: false }),
		pipeline_id: Property.ShortText({ displayName: 'Pipeline ID', description: 'Use List Deal Pipelines to find the ID.', required: false }),
		stage_id: Property.ShortText({ displayName: 'Stage ID', description: 'Use List Deal Stages to find the ID.', required: false }),
		status: Property.StaticDropdown<string>({
			displayName: 'Status',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Open', value: 'open' },
					{ label: 'Won', value: 'won' },
					{ label: 'Lost', value: 'lost' },
				],
			},
		}),
		owner_id: Property.ShortText({ displayName: 'Owner User ID', description: 'Use List Users to find the ID.', required: false }),
		limit: aiProps.limit,
		offset: aiProps.offset,
	},
	async run({ auth, propsValue }) {
		const { limit, offset } = aiInput.pageParams({ limit: propsValue.limit, offset: propsValue.offset });
		const status = aiInput.optionalText(propsValue.status);
		if (status !== undefined && DEAL_STATUS_CODES[status] === undefined) {
			throw new Error('Status must be open, won or lost.');
		}
		const page = await makeClient(auth.props).listPage({
			path: '/deals',
			key: 'deals',
			limit,
			offset,
			query: {
				'filters[search]': aiInput.optionalText(propsValue.search),
				'filters[group]': aiInput.optionalNumericId({ value: propsValue.pipeline_id, label: 'Pipeline ID' }),
				'filters[stage]': aiInput.optionalNumericId({ value: propsValue.stage_id, label: 'Stage ID' }),
				'filters[status]': status === undefined ? undefined : DEAL_STATUS_CODES[status],
				'filters[owner]': aiInput.optionalNumericId({ value: propsValue.owner_id, label: 'Owner User ID' }),
				'orders[cdate]': 'ASC',
			},
		});
		return { ...page, items: page.items.map(aiOutput.dealSummary) };
	},
});
