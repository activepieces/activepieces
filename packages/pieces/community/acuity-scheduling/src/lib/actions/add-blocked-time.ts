import { Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuitySchedulingAuth } from '../../index';
import { API_URL } from '../common';
import { calendarIdDropdown } from '../common/props';

export const addBlockedTimeAction = createAction({
	auth: acuitySchedulingAuth,
	name: 'add_blocked_time',
	displayName: 'Add Blocked Off Time',
	description: 'Block off a specific time range on a calendar.',
	props: {
		start: Property.DateTime({
			displayName: 'Start Time',
			description: 'The start date and time for the block (ISO 8601 format).',
			required: true,
		}),
		end: Property.DateTime({
			displayName: 'End Time',
			description: 'The end date and time for the block (ISO 8601 format).',
			required: true,
		}),
		calendarID: calendarIdDropdown({
			displayName: 'Calendar ID',
			description: 'The numeric ID of the calendar to add this block to.',
			required: true,
		}),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'Optional notes for the blocked off time.',
			required: false,
		}),
	},
	async run(context) {
		const props = context.propsValue;

		// Basic validation: end time must be after start time
		if (new Date(props.start) >= new Date(props.end)) {
			throw new Error('End time must be after start time.');
		}

		const body: Record<string, unknown> = {
			start: props.start,
			end: props.end,
			calendarID: props.calendarID,
		};

		if (props.notes) body['notes'] = props.notes;

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `${API_URL}/blocks`,
			body,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
		});

		return response.body;
	},
});
