import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsStatusMessageOutputSchema } from '../../output-schemas';

export const zohoBookingsUpdateAppointmentDetailsAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_update_appointment_details',
	outputSchema: zohoBookingsStatusMessageOutputSchema,
	displayName: 'Update Appointment Details',
	description: "Update an appointment's notes or custom fields.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Replace the notes and/or set custom booking fields on an appointment by its booking ID. Only the fields you pass change. Use Reschedule Appointment to change its time or staff.',
		idempotent: true,
	},
	props: {
		bookingId: zohoBookingsAiProps.bookingId({ required: true }),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'New notes; replaces the existing notes.',
			required: false,
		}),
		customFields: Property.Json({
			displayName: 'Custom Fields',
			description:
				'Custom booking fields to set, keyed by field label, e.g. {"Department": "Sales"}.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		if (propsValue.notes === undefined && propsValue.customFields === undefined) {
			throw new Error('Provide Notes, Custom Fields or both.');
		}
		return await zohoBookingsApi.updateAppointment({
			auth,
			bookingId: propsValue.bookingId,
			action: 'edit_appointment_info',
			data: {
				...(propsValue.notes !== undefined ? { notes: propsValue.notes } : {}),
				...(propsValue.customFields !== undefined
					? { custom_fields: propsValue.customFields }
					: {}),
			},
		});
	},
});
