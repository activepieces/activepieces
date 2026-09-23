import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { V1ListResponse, pipedriveAtomic } from '../common/atomic-helpers';
import { listCallLogsActionOutputSchema } from '../output-schemas';

const MAX_CALL_LOG_PAGE_LIMIT = 50;

export const listCallLogsAction = createAction({
	auth: pipedriveAuth,
	name: 'list-call-logs',
	outputSchema: listCallLogsActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Call Logs',
	description: 'Lists one page of the connected user\'s call logs.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the call logs belonging to the connected user, one page at a time; pass next_start back as Start to get the next page. Pipedrive returns at most 50 per page and only the authenticated user\'s own logs - there is no way to list another user\'s call logs. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		...pipedriveAtomic.v1PaginationProps(MAX_CALL_LOG_PAGE_LIMIT),
	},
	async run(context) {
		const props = context.propsValue;
		const response = await pipedriveAtomic.call<V1ListResponse<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: '/v1/callLogs',
			resourceLabel: 'call logs',
			query: {
				start: pipedriveAtomic.clampV1Start(props.start),
				limit: pipedriveAtomic.clampV1Limit({
					limit: props.limit,
					maxLimit: MAX_CALL_LOG_PAGE_LIMIT,
				}),
			},
		});
		return pipedriveAtomic.v1Page(response);
	},
});
