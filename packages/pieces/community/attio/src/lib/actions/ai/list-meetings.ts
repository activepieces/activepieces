import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioListMeetingsOutputSchema } from '../../output-schemas';

export const attioListMeetingsAction = createAction({
	auth: attioAuth,
	name: 'attio_list_meetings',
	outputSchema: attioListMeetingsOutputSchema,
	displayName: 'List Meetings',
	description: 'Lists meetings, with optional filters.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists meetings, optionally filtered by linked record, participant emails or time range, sorted by start time. Paginate with the returned cursor.',
		idempotent: true,
	},
	props: {
		linked_object: Property.ShortText({ displayName: 'Linked Object', description: 'Object slug, with Linked Record ID.', required: false }),
		linked_record_id: Property.ShortText({ displayName: 'Linked Record ID', required: false }),
		participants: Property.ShortText({ displayName: 'Participants', description: 'Comma-separated participant email addresses.', required: false }),
		ends_from: Property.DateTime({ displayName: 'Ends From', description: 'Only meetings ending at or after this time.', required: false }),
		starts_before: Property.DateTime({ displayName: 'Starts Before', description: 'Only meetings starting before this time.', required: false }),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Start (oldest first)', value: 'start_asc' },
					{ label: 'Start (newest first)', value: 'start_desc' },
				],
			},
		}),
		limit: attioAi.limitProp({ max: 200 }),
		cursor: attioAi.cursorProp(),
	},
	async run(context) {
		const { linked_object, linked_record_id, participants, ends_from, starts_before, sort, limit, cursor } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/meetings`,
			query: { linked_object, linked_record_id, participants, ends_from, starts_before, sort, limit, cursor },
		});
		return { meetings: response.data, count: response.data.length, next_cursor: response.pagination?.['next_cursor'] ?? null };
	},
});
