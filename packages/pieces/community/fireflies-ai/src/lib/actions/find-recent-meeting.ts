import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { firefliesAiAuth } from '../../index';

export const findRecentMeetingAction = createAction({
	auth: firefliesAiAuth,
	name: 'find_recent_meeting',
	displayName: 'Find Recent Meeting',
	description: 'Retrieve the latest meeting for a user',
	props: {
		limit: Property.Number({
			displayName: 'Number of Meetings',
			description: 'The number of recent meetings to retrieve (default: 1)',
			required: false,
			defaultValue: 1,
		}),
	},
	async run({ propsValue, auth }) {
		const query = `
			query getRecentMeetings($limit: Int!) {
				meetings(first: $limit, orderBy: {field: DATE, direction: DESC}) {
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
				limit: propsValue.limit || 1,
			},
		);

		if (propsValue.limit === 1) {
			return response.data.meetings.nodes[0];
		}

		return response.data.meetings.nodes;
	},
});
