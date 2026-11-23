import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuitySchedulingAuth } from '../auth';
import { API_URL } from '../common';
import { appointmentTypeIdDropdown, calendarIdDropdown } from '../common/props';

export const findAppointmentAction = createAction({
	auth: acuitySchedulingAuth,
	name: 'find_appointment',
	classification: 'SEARCH',
	displayName: 'Find Appointments',
	description: 'Search appointments by client, date and calendar.',
	audience: 'both',
	aiMetadata: {
		description:
			"Searches Acuity appointments and returns matches with a found flag. Filter by client name/email/phone, date range, calendar, appointment type, and status (scheduled, canceled, or all); providing no filters fetches all appointments up to the result limit rather than a targeted match. Use to look up existing appointments or resolve an appointment ID. Read-only and idempotent.",
		idempotent: true,
	},
	propertyGroups: [
		{
			key: 'client',
			display: 'section',
			label: 'Client',
			icon: 'user',
			props: ['filtersInfo', 'firstName', 'lastName', 'email', 'phone'],
		},
		{
			key: 'dates',
			display: 'section',
			label: 'Date Range',
			icon: 'calendar',
			props: ['minDate', 'maxDate'],
		},
		{
			key: 'filters',
			display: 'section',
			label: 'Filters',
			icon: 'filter',
			props: ['calendarID', 'appointmentTypeID', 'status'],
		},
		{
			key: 'results',
			display: 'section',
			label: 'Results',
			icon: 'sliders',
			props: ['maxResults', 'direction'],
		},
	],
	props: {
		filtersInfo: Property.MarkDown({
			value: 'Leave a filter empty to ignore it.',
			variant: MarkdownVariant.INFO,
		}),
		firstName: Property.ShortText({
			displayName: 'First Name',
			placeholder: 'Jane',
			width: 'half',
			required: false,
		}),
		lastName: Property.ShortText({
			displayName: 'Last Name',
			placeholder: 'Doe',
			width: 'half',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			placeholder: 'jane@example.com',
			width: 'half',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			description: 'Include the country code.',
			placeholder: '+15551234567',
			width: 'half',
			required: false,
		}),
		minDate: Property.DateTime({
			displayName: 'From Date',
			width: 'half',
			required: false,
		}),
		maxDate: Property.DateTime({
			displayName: 'To Date',
			width: 'half',
			required: false,
		}),
		calendarID: calendarIdDropdown({
			displayName: 'Calendar',
			required: false,
		}),
		appointmentTypeID: appointmentTypeIdDropdown({
			displayName: 'Appointment Type',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			defaultValue: 'scheduled',
			options: {
				options: [
					{ label: 'Scheduled', value: 'scheduled' },
					{ label: 'Canceled', value: 'canceled' },
					{ label: 'Scheduled and Canceled', value: 'all' },
				],
			},
		}),
		maxResults: Property.Number({
			displayName: 'Max Results',
			description: 'Empty: 100.',
			width: 'half',
			required: false,
		}),
		direction: Property.StaticDropdown({
			displayName: 'Sort Order',
			required: false,
			defaultValue: 'DESC',
			width: 'half',
			options: {
				options: [
					{ label: 'Newest First', value: 'DESC' },
					{ label: 'Oldest First', value: 'ASC' },
				],
			},
		}),
	},
	async run(context) {
		const props = context.propsValue;

		const queryParams: Record<string, string> = {};

		if (props.firstName) queryParams['firstName'] = props.firstName;
		if (props.lastName) queryParams['lastName'] = props.lastName;
		if (props.email) queryParams['email'] = props.email;
		if (props.phone) queryParams['phone'] = props.phone;

		if (props.minDate) queryParams['minDate'] = props.minDate.split('T')[0];
		if (props.maxDate) queryParams['maxDate'] = props.maxDate.split('T')[0];

		if (props.calendarID) queryParams['calendarID'] = props.calendarID.toString();
		if (props.appointmentTypeID)
			queryParams['appointmentTypeID'] = props.appointmentTypeID.toString();

		if (props.status === 'canceled') {
			queryParams['canceled'] = 'true';
		} else if (props.status === 'all') {
			queryParams['showall'] = 'true';
		}

		if (props.maxResults) queryParams['max'] = props.maxResults.toString();
		if (props.direction) queryParams['direction'] = props.direction;

		const response = await httpClient.sendRequest<Array<Record<string, unknown>>>({
			method: HttpMethod.GET,
			url: `${API_URL}/appointments`,
			queryParams,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
		});

		return {
			found: response.body.length > 0,
			data: response.body,
		};
	},
});
