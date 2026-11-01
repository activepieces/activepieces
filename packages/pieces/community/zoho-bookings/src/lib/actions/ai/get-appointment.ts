import { createAction } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsAppointmentOutputSchema } from '../../output-schemas';

export const zohoBookingsGetAppointmentAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_get_appointment',
	outputSchema: zohoBookingsAppointmentOutputSchema,
	displayName: 'Get Appointment',
	description: 'Get one appointment by its booking ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Get the full details of one appointment (customer, service, staff, times, status) by its booking ID. Use List Appointments to search by date, customer or status instead.',
		idempotent: true,
	},
	props: {
		bookingId: zohoBookingsAiProps.bookingId({ required: true }),
	},
	async run({ auth, propsValue }) {
		const response = await zohoBookingsApi.getAppointment({
			auth,
			bookingId: propsValue.bookingId,
		});
		return response.response.returnvalue;
	},
});
