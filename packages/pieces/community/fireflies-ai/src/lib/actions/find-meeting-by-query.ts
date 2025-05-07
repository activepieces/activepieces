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
		startDate: Property.DateTime({
			displayName: 'Start Date',
			description: 'Filter meetings after this date',
			required: false,
		}),
		endDate: Property.DateTime({
			displayName: 'End Date',
			description: 'Filter meetings before this date',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Result Limit',
			description: 'Maximum number of meetings to return',
			required: false,
			defaultValue: 10,
		}),
	},
	async run({ propsValue, auth }) {
		// Build filter object based on provided parameters
		const filters: Record<string, any> = {};

		if (propsValue.title) {
			filters.title = { contains: propsValue.title };
		}

		if (propsValue.hostEmail) {
			filters.host = { email: { equals: propsValue.hostEmail } };
		}

		if (propsValue.participantEmail) {
			filters.participants = { some: { email: { equals: propsValue.participantEmail } } };
		}

		if (propsValue.startDate || propsValue.endDate) {
			filters.date = {};

			if (propsValue.startDate) {
				filters.date.gte = propsValue.startDate;
			}

			if (propsValue.endDate) {
				filters.date.lte = propsValue.endDate;
			}
		}

		const query = `
			query searchMeetings($filters: MeetingFilterInput, $limit: Int!) {
				meetings(first: $limit, filter: $filters, orderBy: {field: DATE, direction: DESC}) {
					nodes {
						id
						title
						date
						duration
						status
						transcript {
							text
						}
						participants {
							name
							email
						}
						summary
					}
				}
			}
		`;

		const response = await makeRequest(
			auth as string,
			HttpMethod.POST,
			query,
			{
				filters,
				limit: propsValue.limit || 10,
			},
		);

		return response.data.meetings.nodes;
	},
});
