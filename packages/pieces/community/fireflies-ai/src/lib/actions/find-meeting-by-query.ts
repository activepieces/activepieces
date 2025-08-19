import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firefliesAiAuth } from '../../index';
import { BASE_URL } from '../common';

export const findMeetingByQueryAction = createAction({
	auth: firefliesAiAuth,
	name: 'find_meeting_by_query',
	displayName: 'Find Meeting by Call Deatils',
	description: 'Searches meetings based on provided parameters.',
	props: {
		title: Property.ShortText({
			displayName: 'Meeting Title',
			required: false,
		}),
		hostEmail: Property.ShortText({
			displayName: 'Host Email',
			description: 'Filter meetings by host email.',
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
	},
	async run({ propsValue, auth }) {
		const filterVariables: Record<string, any> = {};

		if (propsValue.title) {
			filterVariables['title'] = propsValue.title;
		}

		if (propsValue.hostEmail) {
			filterVariables['hostEmail'] = propsValue.hostEmail;
		}

		if (propsValue.participantEmail) {
			filterVariables['participantEmail'] = propsValue.participantEmail;
		}

		if (propsValue.date) {
			// Convert ISO string to milliseconds for the API
			const dateMs = new Date(propsValue.date).getTime();
			filterVariables['date'] = dateMs;
		}

		const query = `
			query Transcripts(
				$title: String
				$hostEmail: String
				$participantEmail: String
				$date: Float
				$limit: Int
  				$skip: Int
			) {
				transcripts(
					title: $title
					host_email: $hostEmail
					participant_email: $participantEmail
					date: $date
					limit: $limit
					skip: $skip
				) {
					id
					dateString
					privacy
					speakers 
					{
						id
						name
					}
					title
					host_email
					organizer_email
					calendar_id
					user 
					{
						user_id
						email
						name
						num_transcripts
						recent_meeting
						minutes_consumed
						is_admin
						integrations
					}
					fireflies_users
					participants
					date
					transcript_url
					audio_url
					video_url
					duration
					meeting_attendees 
					{
						displayName
						email
						phoneNumber
						name
						location
					}
					summary 
					{
						keywords
						action_items
						outline
						shorthand_bullet
						overview
						bullet_gist
						gist
						short_summary
						short_overview
						meeting_type
						topics_discussed
						transcript_chapters
					}
					cal_id
					calendar_type
					meeting_link
				}
			}
		`;

		const limit = 50;
		let skip = 0;
		let hasMore = true;
		const meetings = [];

		while (hasMore) {
			const variables = {
				...filterVariables,
				limit,
				skip,
			};

			const response = await httpClient.sendRequest<{
				data: { transcripts: Record<string, any>[] };
			}>({
				url: BASE_URL,
				method: HttpMethod.POST,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth,
				},
				body: {
					query: query,
					variables,
				},
			});

			const transcripts = response?.body?.data?.transcripts || [];
			if (transcripts.length === 0) {
				hasMore = false;
			} else {
				meetings.push(...transcripts);
				skip += transcripts.length;
			}
		}

		return {
			found: meetings.length !== 0,
			meetings,
		};
	},
});
