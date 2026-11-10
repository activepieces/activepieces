import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioCreateMeetingOutputSchema } from '../../output-schemas';

export const attioLinkMeetingRecordsAction = createAction({
	auth: attioAuth,
	name: 'attio_link_meeting_records',
	outputSchema: attioCreateMeetingOutputSchema,
	displayName: 'Link Meeting Records',
	description: 'Links records to a meeting, keeping existing links.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Adds records to the meeting linked records; already-linked records are ignored and existing links are kept. Use Replace Meeting Records to unlink.',
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
			method: HttpMethod.PATCH,
			resourceUri: `/meetings/${meeting_id}`,
			body: { data: { linked_records: attioAi.records(linked_records) } },
		});
		return response.data;
	},
});
