import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { getOrgLimitsOutputSchema } from '../../output-schemas';

export const getOrgLimits = createAction({
	auth: salesforceAuth,
	name: 'get_org_limits',
	classification: 'READ',
	displayName: 'Get Org Limits',
	description: 'Get the org limits and how much of each is used.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the Salesforce org limits (e.g. DailyApiRequests, DataStorageMB, DailyBulkApiBatches) with max, remaining and used values. Use it to check API or storage headroom before heavy work; for per-object record totals use Get Record Counts. Filter with Name to return only matching limits. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: getOrgLimitsOutputSchema,
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Only return limits whose name contains this text (case-insensitive), e.g. Api or Storage.',
			required: false,
		}),
	},
	async run(context) {
		const response = await callSalesforceApi<Record<string, { Max: number; Remaining: number }>>(
			HttpMethod.GET,
			context.auth,
			'/services/data/v56.0/limits',
			undefined
		);
		const filter = (context.propsValue.name ?? '').trim().toLowerCase();
		const limits = Object.entries(response.body)
			.filter(([name]) => filter.length === 0 || name.toLowerCase().includes(filter))
			.map(([name, limit]) => ({
				name,
				max: limit.Max,
				remaining: limit.Remaining,
				used: limit.Max - limit.Remaining,
			}));
		return { limits, count: limits.length };
	},
});
