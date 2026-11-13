import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsListAppointmentsOutputSchema } from '../../output-schemas';

const STATUS_OPTIONS = [
	{ label: 'Upcoming', value: 'UPCOMING' },
	{ label: 'Ongoing', value: 'ONGOING' },
	{ label: 'Pending', value: 'PENDING' },
	{ label: 'Completed', value: 'COMPLETED' },
	{ label: 'Cancelled', value: 'CANCEL' },
	{ label: 'No-show', value: 'NO_SHOW' },
	{ label: 'Pending Payment', value: 'PENDING_PAYMENT' },
	{ label: 'Payment Failed', value: 'PAYMENT_FAILURE' },
];

export const zohoBookingsListAppointmentsAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_list_appointments',
	outputSchema: zohoBookingsListAppointmentsOutputSchema,
	displayName: 'List Appointments',
	description: 'List appointments in a time range, with optional filters.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'List appointments between two times, optionally filtered by service, staff, resource, status or customer (name, email and phone match on "contains"). With no times it returns today\'s appointments; with only a start time, one day from it. Returns one page; when next_page_available is true, call again with the next page and the same filters.',
		idempotent: true,
	},
	props: {
		fromTime: zohoBookingsAiProps.dateTime({
			required: false,
			displayName: 'From Time',
			description: 'Start of the range.',
		}),
		toTime: zohoBookingsAiProps.dateTime({
			required: false,
			displayName: 'To Time',
			description: 'End of the range.',
		}),
		serviceId: zohoBookingsAiProps.serviceId({ required: false }),
		staffId: zohoBookingsAiProps.staffId({ required: false }),
		resourceId: zohoBookingsAiProps.resourceId({ required: false }),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			options: { disabled: false, options: STATUS_OPTIONS },
		}),
		customerName: Property.ShortText({ displayName: 'Customer Name', required: false }),
		customerEmail: Property.ShortText({ displayName: 'Customer Email', required: false }),
		customerPhone: Property.ShortText({ displayName: 'Customer Phone', required: false }),
		createdFrom: zohoBookingsAiProps.dateTime({
			required: false,
			displayName: 'Booked From',
			description: 'Only appointments booked at or after this time.',
		}),
		createdTill: zohoBookingsAiProps.dateTime({
			required: false,
			displayName: 'Booked Until',
			description: 'Only appointments booked at or before this time.',
		}),
		includeCustomFields: Property.Checkbox({
			displayName: 'Include Custom Fields',
			description: "Also return the booking form's custom fields (smaller pages).",
			required: false,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number, starting at 1. Defaults to 1.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Appointments per page (1-100). Defaults to 50.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const page = propsValue.page ?? 1;
		const limit = Math.min(Math.max(propsValue.limit ?? 50, 1), 100);
		const result = await zohoBookingsApi.searchAppointments({
			auth,
			fromTime: propsValue.fromTime,
			toTime: propsValue.toTime,
			serviceId: propsValue.serviceId,
			staffId: propsValue.staffId,
			resourceId: propsValue.resourceId,
			status: propsValue.status,
			customerName: propsValue.customerName,
			customerEmail: propsValue.customerEmail,
			customerPhone: propsValue.customerPhone,
			createdFrom: propsValue.createdFrom,
			createdTill: propsValue.createdTill,
			includeCustomFields: propsValue.includeCustomFields,
			page,
			perPage: limit,
		});
		const appointments = Array.isArray(result.response) ? result.response : [];
		return {
			appointments,
			count: appointments.length,
			page,
			next_page_available: result.next_page_available ?? false,
		};
	},
});
