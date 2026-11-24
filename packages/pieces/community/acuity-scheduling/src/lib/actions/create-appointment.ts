import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuitySchedulingAuth } from '../auth';
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
	classification: 'WRITE',
	displayName: 'Create Appointment',
	description: 'Creates a new appointment.',
	audience: 'both',
	aiMetadata: {
		description:
			'Books a new appointment for a client on Acuity given a datetime, appointment type, and client name. Operates in two modes: standard booking enforces availability/attribute checks and auto-assigns a calendar, while admin booking (enable Book as Admin) bypasses those checks, allows setting notes, and requires a calendar ID. Use to schedule a client; not idempotent — each call creates a separate appointment.',
		idempotent: false,
	},
	propertyGroups: [
		{
			key: 'appointment',
			display: 'section',
			label: 'Appointment',
			icon: 'calendar',
			props: ['appointmentTypeID', 'calendarID', 'datetime', 'timezone'],
		},
		{
			key: 'client',
			display: 'section',
			label: 'Client',
			icon: 'user',
			props: ['firstName', 'lastName', 'email', 'phone'],
		},
		{
			key: 'booking',
			display: 'section',
			label: 'Admin Booking',
			icon: 'sliders',
			props: ['adminInfo', 'adminBooking', 'notes'],
		},
	],
	props: {
		appointmentTypeID: appointmentTypeIdDropdown({
			displayName: 'Appointment Type',
			description: 'The service being booked.',
			required: true,
		}),
		calendarID: calendarIdDropdown({
			displayName: 'Calendar',
			description: 'Required when booking as admin. Empty: Acuity picks one.',
			required: false,
		}),
		datetime: Property.DateTime({
			displayName: 'Date and Time',
			description: 'When the appointment starts.',
			width: 'half',
			required: true,
		}),
		timezone: Property.ShortText({
			displayName: 'Timezone',
			description: 'Used to check availability.',
			placeholder: 'America/New_York',
			width: 'half',
			required: true,
			defaultValue: 'UTC',
		}),
		firstName: Property.ShortText({
			displayName: 'First Name',
			placeholder: 'Jane',
			width: 'half',
			required: true,
		}),
		lastName: Property.ShortText({
			displayName: 'Last Name',
			placeholder: 'Doe',
			width: 'half',
			required: true,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Required unless booking as admin.',
			placeholder: 'jane@example.com',
			width: 'half',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			placeholder: '+15551234567',
			width: 'half',
			required: false,
		}),
		adminInfo: Property.MarkDown({
			value:
				'Admin booking skips availability checks, needs a calendar, and is the only way to save notes.',
			variant: MarkdownVariant.INFO,
		}),
		adminBooking: Property.Checkbox({
			displayName: 'Book as Admin',
			description: 'Book even if the slot is not open.',
			required: false,
			defaultValue: false,
		}),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'Saved only when booking as admin.',
			required: false,
		}),
		addonIDs: addonIdsDropdown({
			displayName: 'Add-ons',
			description: 'Extras offered with the selected appointment type.',
			required: false,
			advanced: true,
		}),
		labelId: labelIdDropdown({
			displayName: 'Label',
			description: 'Tag the appointment with one label.',
			required: false,
			advanced: true,
		}),
		certificate: Property.ShortText({
			displayName: 'Coupon or Package Code',
			placeholder: 'SPRING10',
			advanced: true,
			required: false,
		}),
		smsOptIn: Property.Checkbox({
			displayName: 'SMS Opt-In',
			description: 'The client agreed to receive SMS reminders.',
			advanced: true,
			required: false,
			defaultValue: false,
		}),
		noEmail: Property.Checkbox({
			displayName: 'Skip Confirmation Message',
			description: "Don't send the client the confirmation email or SMS.",
			advanced: true,
			required: false,
			defaultValue: false,
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
			body['labels'] = [{ id: props.labelId }];
		}

		if (props.adminBooking && !props.calendarID) {
			throw new Error('Calendar is required when booking as admin.');
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
