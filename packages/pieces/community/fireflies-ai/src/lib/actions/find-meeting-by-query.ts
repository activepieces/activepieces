import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firefliesAiAuth } from '../auth';
import { BASE_URL } from '../common';

export const findMeetingByQueryAction = createAction({
	auth: firefliesAiAuth,
	name: 'find_meeting_by_query',
	classification: 'SEARCH',
	displayName: 'Search Meetings',
	description: 'Finds meetings by title, host, participant or date.',
	audience: 'both',
	aiMetadata: { description: 'Searches Fireflies meeting transcripts, optionally filtered by title, host email, participant email, and/or date, paging through all matches. Use when locating meetings by attributes rather than a known ID; leaving all filters empty returns the full meeting history. Read-only and idempotent.', idempotent: true },
	props: {
		title: Property.ShortText({
			displayName: 'Meeting Title',
			required: false,
			icon: 'text',
			placeholder: 'Weekly sync',
		}),
		hostEmail: Property.ShortText({
			displayName: 'Host Email',
			required: false,
			icon: 'user',
			placeholder: 'ana@acme.com',
		}),
		participantEmail: Property.ShortText({
			displayName: 'Participant Email',
			description: 'Meetings with this email among the attendees.',
			required: false,
			icon: 'users',
			placeholder: 'sam@acme.com',
		}),
		date: Property.DateTime({
			displayName: 'Date',
			description: 'Meetings from this day (UTC).',
			required: false,
			icon: 'calendar',
		}),
	},
	propertyGroups: [
		{ key: 'meeting', display: 'builder', label: 'Meeting', icon: 'text', props: ['title'] },
		{ key: 'people', display: 'builder', label: 'People', icon: 'users', props: ['hostEmail', 'participantEmail'] },
		{ key: 'time', display: 'builder', label: 'Time', icon: 'calendar', props: ['date'] },
	],
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
					token: auth.secret_text,
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
