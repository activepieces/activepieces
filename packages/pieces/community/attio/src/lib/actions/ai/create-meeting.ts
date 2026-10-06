import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioCreateMeetingOutputSchema } from '../../output-schemas';

export const attioCreateMeetingAction = createAction({
	auth: attioAuth,
	name: 'attio_create_meeting',
	outputSchema: attioCreateMeetingOutputSchema,
	displayName: 'Create Meeting',
	description: 'Creates a meeting with participants and linked records.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a meeting, e.g. to log an external call before attaching a recording with Create Call Recording. Not idempotent: repeated calls create duplicates.',
		idempotent: false,
	},
	props: {
		title: Property.ShortText({ displayName: 'Title', required: true }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		start: Property.DateTime({ displayName: 'Start', required: true }),
		end: Property.DateTime({ displayName: 'End', required: true }),
		is_all_day: Property.Checkbox({ displayName: 'All Day', description: 'Only the dates of Start and End are used.', required: false }),
		timezone: Property.ShortText({ displayName: 'Timezone', description: 'IANA timezone, e.g. `Europe/London`.', required: false }),
		participants: Property.Array({
			displayName: 'Participants',
			required: true,
			properties: {
				email_address: Property.ShortText({ displayName: 'Email', required: true }),
				name: Property.ShortText({ displayName: 'Name', required: false }),
				is_organizer: Property.Checkbox({ displayName: 'Organizer', required: false }),
				status: Property.StaticDropdown({
					displayName: 'Status',
					description: 'Defaults to accepted.',
					required: false,
					options: {
						disabled: false,
						options: [
							{ label: 'Accepted', value: 'accepted' },
							{ label: 'Tentative', value: 'tentative' },
							{ label: 'Declined', value: 'declined' },
							{ label: 'Pending', value: 'pending' },
						],
					},
				}),
			},
		}),
		linked_records: attioAi.linkedRecordsProp({ description: 'Records to link to the meeting.' }),
	},
	async run(context) {
		const { title, description, start, end, is_all_day, timezone, participants, linked_records } = context.propsValue;
		const toTime = (value: string) => (is_all_day ? { date: value.slice(0, 10) } : { datetime: value, timezone: timezone ?? null });
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/meetings`,
			body: {
				data: {
					title,
					description: description ?? '',
					start: toTime(start),
					end: toTime(end),
					is_all_day: is_all_day ?? false,
					participants: attioAi.records(participants).map((participant) => ({
						...attioAi.compact({ email_address: participant['email_address'], name: participant['name'] }),
						is_organizer: participant['is_organizer'] === true,
						status: participant['status'] ?? 'accepted',
					})),
					linked_records: attioAi.records(linked_records),
				},
			},
		});
		return response.data;
	},
});
