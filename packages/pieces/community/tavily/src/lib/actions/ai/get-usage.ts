import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tavilyAuth } from '../../auth';
import { tavilyCommon } from '../../common/client';
import { tavilyGetUsageOutputSchema } from '../../output-schemas';

export const getUsageAction = createAction({
	name: 'tavily_get_usage',
	outputSchema: tavilyGetUsageOutputSchema,
	classification: 'READ',
	displayName: 'Get Usage',
	description: 'Get API key and account credit usage for the connected Tavily account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Read the connected API key and account-level credit usage, broken down by endpoint (search, extract, crawl, map, research). Use to check remaining credits or usage against plan limits before running a costly operation. Read-only and idempotent.',
		idempotent: true,
	},
	auth: tavilyAuth,
	props: {
		project_id: Property.ShortText({
			displayName: 'Project ID',
			description: 'Optional project id to scope the usage query to a specific project.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return tavilyCommon.request({
			apiKey: auth.secret_text,
			method: HttpMethod.GET,
			path: '/usage',
			headers: {
				...(propsValue.project_id !== undefined && { 'X-Project-ID': propsValue.project_id }),
			},
		});
	},
});
