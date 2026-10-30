import { createAction } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsAppointmentOutputSchema } from '../../output-schemas';

export const zohoBookingsRescheduleAppointmentAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_reschedule_appointment',
	outputSchema: zohoBookingsAppointmentOutputSchema,
	displayName: 'Reschedule Appointment',
	description: 'Move an appointment to a new time or another staff member.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Move an appointment, by its booking ID, to a new start time and/or a different staff member or staff group. Provide at least one of the three; use Get Available Slots to pick a free time. Not idempotent.',
		idempotent: false,
	},
	props: {
		bookingId: zohoBookingsAiProps.bookingId({ required: true }),
		startTime: zohoBookingsAiProps.dateTime({ required: false, displayName: 'New Start Time' }),
		staffId: zohoBookingsAiProps.staffId({ required: false }),
		groupId: zohoBookingsAiProps.groupId({ required: false }),
	},
	async run({ auth, propsValue }) {
		if (!propsValue.startTime && !propsValue.staffId && !propsValue.groupId) {
			throw new Error('Provide at least one of New Start Time, Staff ID or Group ID.');
		}
		const response = await zohoBookingsApi.rescheduleAppointment({
			auth,
			bookingId: propsValue.bookingId,
			startTime: propsValue.startTime,
			staffId: propsValue.staffId,
			groupId: propsValue.groupId,
		});
		return response.returnvalue;
	},
});
