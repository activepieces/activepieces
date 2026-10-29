import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsAppointmentOutputSchema } from '../../output-schemas';

export const zohoBookingsUpdateAppointmentStatusAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_update_appointment_status',
	outputSchema: zohoBookingsAppointmentOutputSchema,
	displayName: 'Update Appointment Status',
	description: 'Mark an appointment as completed, cancelled or no-show.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			"Set an appointment's status to completed, cancelled or no-show by its booking ID. Completed and no-show are accepted only after the appointment's start time. Cancelling frees the slot and can't be undone through the API. Use Reschedule Appointment to move it instead.",
		idempotent: true,
	},
	props: {
		bookingId: zohoBookingsAiProps.bookingId({ required: true }),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Completed', value: 'completed' },
					{ label: 'Cancelled', value: 'cancel' },
					{ label: 'No-show', value: 'noshow' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoBookingsApi.updateAppointment({
			auth,
			bookingId: propsValue.bookingId,
			action: propsValue.status,
		});
	},
});
