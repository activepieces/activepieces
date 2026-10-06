import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioListCallRecordingsOutputSchema } from '../../output-schemas';

export const attioListCallRecordingsAction = createAction({
	auth: attioAuth,
	name: 'attio_list_call_recordings',
	outputSchema: attioListCallRecordingsOutputSchema,
	displayName: 'List Call Recordings',
	description: 'Lists the call recordings of a meeting.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists call recordings of a meeting with their status. Use Get Call Recording for the transcript.',
		idempotent: true,
	},
	props: {
		meeting_id: Property.ShortText({ displayName: 'Meeting ID', description: 'From List Meetings or Create Meeting.', required: true }),
		limit: attioAi.limitProp({ max: 200 }),
		cursor: attioAi.cursorProp(),
	},
	async run(context) {
		const { meeting_id, limit, cursor } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/meetings/${meeting_id}/call_recordings`,
			query: { limit, cursor },
		});
		return { call_recordings: response.data, count: response.data.length, next_cursor: response.pagination?.['next_cursor'] ?? null };
	},
});
