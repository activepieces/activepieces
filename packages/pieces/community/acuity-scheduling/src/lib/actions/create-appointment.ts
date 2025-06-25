import { Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuitySchedulingAuth } from '../../index';
import { API_URL } from '../common';
import {
	addonIdsDropdown,
	appointmentTypeIdDropdown,
	calendarIdDropdown,
	labelIdDropdown,
} from '../common/props';

export const createAppointmentAction = createAction({
	auth: acuitySchedulingAuth,
	name: 'create_appointment',
	displayName: 'Create Appointment',
	description: 'Creates a new appointment.',
	props: {
		datetime: Property.DateTime({
			displayName: 'DateTime',
			description: 'Date and time of the appointment.',
			required: true,
		}),
		appointmentTypeID: appointmentTypeIdDropdown({
			displayName: 'Appointment Type',
			description: 'Select the type of appointment.',
			required: true,
		}),
		firstName: Property.ShortText({
			displayName: 'First Name',
			description: "Client's first name.",
			required: true,
		}),
		lastName: Property.ShortText({
			displayName: 'Last Name',
			description: "Client's last name.",
			required: true,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: "Client's email address. (Optional if booking as admin).",
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			description: "Client's phone number.",
			required: false,
		}),
		timezone: Property.ShortText({
			displayName: 'Timezone',
			description:
				"Client's timezone (e.g., America/New_York). Required for accurate availability checking.",
			required: true,
			defaultValue: 'UTC',
		}),
		adminBooking: Property.Checkbox({
			displayName: 'Book as Admin',
			description:
				'Set to true to book as an admin. Disables availability/attribute validations, allows setting notes, and makes Calendar ID required.',
			required: false,
			defaultValue: false,
		}),
		calendarID: calendarIdDropdown({
			displayName: 'Calendar ID',
			description:
				'Numeric ID of the calendar. Required if booking as admin. If not provided, Acuity tries to find an available calendar automatically for non-admin bookings.',
			required: false,
		}),
		noEmail: Property.Checkbox({
			displayName: 'Suppress Confirmation Email/SMS',
			description: 'If true, confirmation emails or SMS will not be sent.',
			required: false,
			defaultValue: false,
		}),
		certificate: Property.ShortText({
			displayName: 'Certificate Code',
			description: 'Package or coupon certificate code.',
			required: false,
		}),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'Appointment notes. Only settable if booking as admin.',
			required: false,
		}),
		smsOptIn: Property.Checkbox({
			displayName: 'SMS Opt-In',
			description:
				'Indicates whether the client has explicitly given permission to receive SMS messages.',
			required: false,
			defaultValue: false,
		}),
		addonIDs: addonIdsDropdown({
			displayName: 'Addons',
			description:
				'Select addons for the appointment. Addons are filtered by selected Appointment Type if available.',
			required: false,
		}),
		labelId: labelIdDropdown({
			displayName: 'Label',
			description: 'Apply a label to the appointment. The API currently supports one label.',
			required: false,
		}),
	},
	async run(context) {
		const props = context.propsValue;

		const queryParams: Record<string, string> = {};
		if (props.adminBooking) {
			queryParams['admin'] = 'true';
		}
		if (props.noEmail) {
			queryParams['noEmail'] = 'true';
		}

		const body: Record<string, unknown> = {
			datetime: props.datetime,
			appointmentTypeID: props.appointmentTypeID,
			firstName: props.firstName,
			lastName: props.lastName,
			email: props.email,
		};

		if (props.calendarID) body['calendarID'] = props.calendarID;
		if (props.phone) body['phone'] = props.phone;
		if (props.timezone) body['timezone'] = props.timezone;
		if (props.certificate) body['certificate'] = props.certificate;
		if (props.adminBooking && props.notes) body['notes'] = props.notes;
		if (props.smsOptIn) body['smsOptIn'] = props.smsOptIn;

		if (props.addonIDs && props.addonIDs.length > 0) {
			body['addonIDs'] = props.addonIDs;
		}
		if (props.labelId) {
			body['labelID'] = [{ id: props.labelId }];
		}

		if (props.adminBooking && !props.calendarID) {
			throw new Error('Calendar ID is required when booking as admin.');
		}
		if (props.adminBooking && props.email === '') {
			delete body['email'];
		}

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `${API_URL}/appointments`,
			queryParams: queryParams,
			body: body,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
		});

		return response.body;
	},
});
