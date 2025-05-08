import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { firefliesAiAuth } from '../../index';

export const findMeetingByQueryAction = createAction({
	auth: firefliesAiAuth,
	name: 'find_meeting_by_query',
	displayName: 'Find Meeting by Query',
	description: 'Search for a meeting using host, title, date, or participant email',
	props: {
		title: Property.ShortText({
			displayName: 'Title Contains',
			description: 'Search for meetings with titles containing this text',
			required: false,
		}),
		hostEmail: Property.ShortText({
			displayName: 'Host Email',
			description: 'Filter meetings by host email',
			required: false,
		}),
		participantEmail: Property.ShortText({
			displayName: 'Participant Email',
			description: 'Filter meetings by participant email',
			required: false,
		}),
		date: Property.DateTime({
			displayName: 'Date',
			description: 'Filter meetings on this date (YYYY-MM-DD).',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Result Limit',
			description: 'Maximum number of meetings to return. The API allows up to 50 meetings per request.',
			required: false,
			defaultValue: 10,
		}),
	},
	async run({ propsValue, auth }) {
		const variables: Record<string, any> = {};

		if (propsValue.title) {
			variables['title'] = propsValue.title;
		}

		if (propsValue.hostEmail) {
			variables['hostEmail'] = propsValue.hostEmail;
		}

		if (propsValue.participantEmail) {
			variables['participantEmail'] = propsValue.participantEmail;
		}

		if (propsValue.date) {
			// Convert ISO string to milliseconds for the API
			const dateMs = new Date(propsValue.date).getTime();
			variables['date'] = dateMs;
		}

		if (propsValue.limit) {
			variables['limit'] = propsValue.limit;
		} else {
			variables['limit'] = 10; // Default limit if not specified
		}

		const query = `
			query Transcripts(
				$title: String
				$hostEmail: String
				$participantEmail: String
				$date: Float
				$limit: Int
			) {
				transcripts(
					title: $title
					host_email: $hostEmail
					participant_email: $participantEmail
					date: $date
					limit: $limit
				) {
					id
					title
					date
					duration
					transcript_url
					speakers {
						id
						name
					}
					participants
					meeting_attendees {
						displayName
						email
					}
					summary {
						action_items
						overview
					}
				}
			}
		`;

		const response = await makeRequest(
			auth as string,
			HttpMethod.POST,
			query,
			variables,
		);

		return response.data.transcripts;
	},
});
