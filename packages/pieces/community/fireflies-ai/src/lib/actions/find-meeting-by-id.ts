import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { firefliesAiAuth } from '../../index';

export const findMeetingByIdAction = createAction({
	auth: firefliesAiAuth,
	name: 'find_meeting_by_id',
	displayName: 'Find Meeting by ID',
	description: 'Fetch a specific meeting\'s transcript and metadata by its ID',
	props: {
		meetingId: Property.ShortText({
			displayName: 'Meeting ID',
			description: 'The ID of the meeting to retrieve',
			required: true,
		}),
	},
	async run({ propsValue, auth }) {
		const query = `
			query getMeeting($id: ID!) {
				meeting(id: $id) {
					id
					title
					date
					duration
					status
					transcript {
						text
						words {
							text
							startTime
							endTime
							speaker
						}
					}
					participants {
						name
						email
						duration
					}
					summary
					topics
					actionItems
					questions
				}
			}
		`;

		const response = await makeRequest(
			auth as string,
			HttpMethod.POST,
			query,
			{
				id: propsValue.meetingId,
			},
		);

		return response.data.meeting;
	},
});
