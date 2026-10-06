import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioCreateMeetingOutputSchema } from '../../output-schemas';

export const attioReplaceMeetingRecordsAction = createAction({
	auth: attioAuth,
	name: 'attio_replace_meeting_records',
	outputSchema: attioCreateMeetingOutputSchema,
	displayName: 'Replace Meeting Records',
	description: 'Replaces all records linked to a meeting.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Sets the meeting linked records to exactly the given list; any record not in it is unlinked, including ones linked automatically.',
		idempotent: true,
	},
	props: {
		meeting_id: Property.ShortText({ displayName: 'Meeting ID', description: 'From List Meetings or Create Meeting.', required: true }),
		linked_records: attioAi.linkedRecordsProp({ description: 'Records to link to the meeting.' }),
	},
	async run(context) {
		const { meeting_id, linked_records } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.PUT,
			resourceUri: `/meetings/${meeting_id}`,
			body: { data: { linked_records: attioAi.records(linked_records) } },
		});
		return response.data;
	},
});
