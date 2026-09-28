import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tavilyAuth } from '../../auth';
import { tavilyCommon } from '../../common/client';
import { tavilyGetResearchTaskOutputSchema } from '../../output-schemas';

export const getResearchTaskAction = createAction({
	name: 'tavily_get_research_task',
	outputSchema: tavilyGetResearchTaskOutputSchema,
	classification: 'READ',
	displayName: 'Get Research Task',
	description: 'Get the status and result of a research task by its request id.',
	audience: 'ai',
	aiMetadata: {
		description:
			"Read the status and, once finished, the content and sources of a research task started with `tavily_start_research_task`. Status is one of pending, in_progress, completed, or failed; only a completed task carries content and sources. Use to poll a previously started research task. Read-only and idempotent.",
		idempotent: true,
	},
	auth: tavilyAuth,
	props: {
		request_id: Property.ShortText({
			displayName: 'Request ID',
			description: 'The request id returned by Start Research Task.',
			required: true,
		}),
		include_usage: Property.Checkbox({
			displayName: 'Include Usage',
			description: 'Include credit usage information in the response.',
			required: false,
			defaultValue: false,
		}),
	},
	async run({ auth, propsValue }) {
		return tavilyCommon.request({
			apiKey: auth.secret_text,
			method: HttpMethod.GET,
			path: `/research/${encodeURIComponent(propsValue.request_id)}`,
			queryParams: {
				...(propsValue.include_usage !== undefined && {
					include_usage: String(propsValue.include_usage),
				}),
			},
		});
	},
});
