import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsBookAppointmentOutputSchema } from '../../output-schemas';

export const zohoBookingsBookAppointmentAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_book_appointment',
	outputSchema: zohoBookingsBookAppointmentOutputSchema,
	displayName: 'Book Appointment',
	description: 'Book an appointment for a customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Book a new appointment for a customer on a service at a start time. Assign it to a staff member, a resource or a staff group (one is required); use Get Available Slots first to pick a free time. Not idempotent: each call books a separate appointment.',
		idempotent: false,
	},
	props: {
		serviceId: zohoBookingsAiProps.serviceId({ required: true }),
		staffId: zohoBookingsAiProps.staffId({ required: false }),
		resourceId: zohoBookingsAiProps.resourceId({ required: false }),
		groupId: zohoBookingsAiProps.groupId({ required: false }),
		fromTime: zohoBookingsAiProps.dateTime({
			required: true,
			displayName: 'Start Time',
			description: 'Start of the appointment.',
		}),
		toTime: zohoBookingsAiProps.dateTime({
			required: false,
			displayName: 'End Time',
			description: 'End of the booking; only for resource-booking services.',
		}),
		timezone: Property.ShortText({
			displayName: 'Time Zone',
			description:
				'IANA time zone for the appointment, e.g. "America/New_York". Defaults to the workspace time zone.',
			required: false,
		}),
		customerName: Property.ShortText({ displayName: 'Customer Name', required: true }),
		customerEmail: Property.ShortText({ displayName: 'Customer Email', required: true }),
		customerPhone: Property.ShortText({ displayName: 'Customer Phone', required: true }),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'Notes about the appointment.',
			required: false,
		}),
		additionalFields: Property.Json({
			displayName: 'Custom Fields',
			description:
				'Values for the booking form\'s custom fields, keyed by field label, e.g. {"Company": "Acme"}.',
			required: false,
		}),
		costPaid: Property.Number({
			displayName: 'Amount Paid',
			description: 'Amount the customer already paid.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		if (!propsValue.staffId && !propsValue.resourceId && !propsValue.groupId) {
			throw new Error('Provide one of Staff ID, Resource ID or Group ID.');
		}
		const response = await zohoBookingsApi.bookAppointment({
			auth,
			serviceId: propsValue.serviceId,
			fromTime: propsValue.fromTime,
			customerName: propsValue.customerName,
			customerEmail: propsValue.customerEmail,
			customerPhone: propsValue.customerPhone,
			staffId: propsValue.staffId,
			resourceId: propsValue.resourceId,
			groupId: propsValue.groupId,
			toTime: propsValue.toTime,
			timezone: propsValue.timezone,
			notes: propsValue.notes,
			additionalFields: propsValue.additionalFields,
			costPaid: propsValue.costPaid,
		});
		return response.returnvalue;
	},
});
