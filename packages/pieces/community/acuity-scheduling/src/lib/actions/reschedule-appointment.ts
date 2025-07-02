import { Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuitySchedulingAuth } from '../../index';
import { API_URL } from '../common';
import { appointmentTypeIdDropdown, calendarIdDropdown } from '../common/props';

export const rescheduleAppointmentAction = createAction({
	auth: acuitySchedulingAuth,
	name: 'reschedule_appointment',
	displayName: 'Reschedule Appointment',
	description: 'Reschedules an existing appointment to a new date/time.',
	props: {
		id: Property.Number({
			displayName: 'Appointment ID',
			description: 'The ID of the appointment to reschedule.',
			required: true,
		}),
		appointmentTypeID: appointmentTypeIdDropdown({
			displayName: 'Appointment Type',
			description: 'Select the type of appointment (used for finding new available slots).',
			required: true,
		}),
		datetime: Property.DateTime({
			displayName: 'DateTime',
			description: 'New Date and time of the appointment.',
			required: true,
		}),
		timezone: Property.ShortText({
			displayName: 'Timezone',
			description: "Client's timezone (e.g., America/New_York).",
			required: true,
			defaultValue: 'UTC',
		}),
		calendarID: calendarIdDropdown({
			displayName: 'New Calendar ID',
			description:
				'Numeric ID of the new calendar to reschedule to. If blank, stays on current calendar. Submit 0 to auto-assign.',
			required: false,
		}),
		adminReschedule: Property.Checkbox({
			displayName: 'Reschedule as Admin',
			description: 'Set to true to reschedule as an admin. Disables availability validations.',
			required: false,
			defaultValue: false,
		}),
		noEmail: Property.Checkbox({
			displayName: 'Suppress Rescheduling Email/SMS',
			description: 'If true, rescheduling emails or SMS will not be sent.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const props = context.propsValue;

		const queryParams: Record<string, string> = {};
		if (props.adminReschedule) {
			queryParams['admin'] = 'true';
		}
		if (props.noEmail) {
			queryParams['noEmail'] = 'true';
		}

		const body: Record<string, unknown> = {
			datetime: props.datetime,
		};

		if (props.calendarID !== undefined) {
			// Allow 0 for auto-assign
			body['calendarID'] = props.calendarID === 0 ? null : props.calendarID;
		}
		if (props.timezone) {
			body['timezone'] = props.timezone;
		}

		const response = await httpClient.sendRequest({
			method: HttpMethod.PUT,
			url: `${API_URL}/appointments/${props.id}/reschedule`,
			queryParams,
			body,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
		});

		return response.body;
	},
});
