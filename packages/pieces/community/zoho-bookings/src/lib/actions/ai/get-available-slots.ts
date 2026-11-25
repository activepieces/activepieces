import { createAction } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsGetAvailableSlotsOutputSchema } from '../../output-schemas';

export const zohoBookingsGetAvailableSlotsAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_get_available_slots',
	outputSchema: zohoBookingsGetAvailableSlotsOutputSchema,
	displayName: 'Get Available Slots',
	description: 'Get the free time slots for a service on a date.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Get the open time slots on one date for a service, for a staff member, resource or staff group (one is required). Use it before Book Appointment or Reschedule Appointment. Slot times use the time format set in the Zoho Bookings account.',
		idempotent: true,
	},
	props: {
		serviceId: zohoBookingsAiProps.serviceId({ required: true }),
		date: zohoBookingsAiProps.dateTime({
			required: true,
			displayName: 'Date',
			description: 'Day to check; only the date part is used.',
		}),
		staffId: zohoBookingsAiProps.staffId({ required: false }),
		resourceId: zohoBookingsAiProps.resourceId({ required: false }),
		groupId: zohoBookingsAiProps.groupId({ required: false }),
	},
	async run({ auth, propsValue }) {
		if (!propsValue.staffId && !propsValue.resourceId && !propsValue.groupId) {
			throw new Error('Provide one of Staff ID, Resource ID or Group ID.');
		}
		const response = await zohoBookingsApi.getAvailableSlots({
			auth,
			serviceId: propsValue.serviceId,
			selectedDate: propsValue.date,
			staffId: propsValue.staffId,
			resourceId: propsValue.resourceId,
			groupId: propsValue.groupId,
		});
		const { time_zone, data } = response.response.returnvalue;
		return { time_zone, slots: Array.isArray(data) ? data : [] };
	},
});
