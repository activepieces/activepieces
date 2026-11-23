import { Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuitySchedulingAuth } from '../auth';
import { API_URL } from '../common';
import { appointmentTypeIdDropdown, calendarIdDropdown } from '../common/props';

export const rescheduleAppointmentAction = createAction({
	auth: acuitySchedulingAuth,
	name: 'reschedule_appointment',
	classification: 'WRITE',
	displayName: 'Reschedule Appointment',
	description: 'Reschedules an existing appointment to a new date/time.',
	audience: 'both',
	aiMetadata: {
		description:
			'Moves an existing Acuity appointment (by numeric appointment ID) to a new datetime and timezone, optionally onto a different calendar. Admin reschedule bypasses availability checks. Use to change the time of an already-booked appointment rather than creating a new one. Treated as non-idempotent — repeating may resend rescheduling notifications and revalidate availability.',
		idempotent: false,
	},
	propertyGroups: [
		{
			key: 'appointment',
			display: 'section',
			label: 'Appointment',
			icon: 'calendar',
			props: ['id'],
		},
		{
			key: 'newTime',
			display: 'section',
			label: 'New Time',
			icon: 'calendar',
			props: ['datetime', 'timezone', 'calendarID'],
		},
	],
	props: {
		id: Property.Number({
			displayName: 'Appointment ID',
			description: 'From a trigger or the Find Appointments step.',
			required: true,
		}),
		datetime: Property.DateTime({
			displayName: 'Date and Time',
			description: 'When the appointment should now start.',
			width: 'half',
			required: true,
		}),
		timezone: Property.ShortText({
			displayName: 'Timezone',
			description: "The client's time zone.",
			placeholder: 'America/New_York',
			width: 'half',
			required: true,
			defaultValue: 'UTC',
		}),
		calendarID: calendarIdDropdown({
			displayName: 'New Calendar',
			description: 'Empty keeps its calendar; 0 lets Acuity pick one.',
			required: false,
		}),
		adminReschedule: Property.Checkbox({
			displayName: 'Reschedule as Admin',
			description: 'Move it even if the new slot is not open.',
			advanced: true,
			required: false,
			defaultValue: false,
		}),
		noEmail: Property.Checkbox({
			displayName: 'Skip Reschedule Message',
			description: "Don't send the client the reschedule email or SMS.",
			advanced: true,
			required: false,
			defaultValue: false,
		}),
		appointmentTypeID: appointmentTypeIdDropdown({
			displayName: 'Appointment Type',
			description: 'Not sent to Acuity; the appointment keeps its type.',
			required: false,
			advanced: true,
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

		if (props.calendarID === 0) {
			body['calendarID'] = null;
		} else if (props.calendarID) {
			body['calendarID'] = props.calendarID;
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
