import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { zohoBookingsAuth } from '../auth';
import { zohoBookingsApi } from '../common/api';
import { zohoBookingsProps } from '../common/props';
import { rescheduleAppointmentOutputSchema } from '../output-schemas';

export const rescheduleAppointmentAction = createAction({
  auth: zohoBookingsAuth,
  name: 'rescheduleAppointment',
  outputSchema: rescheduleAppointmentOutputSchema,
  classification: 'WRITE',
  displayName: 'Reschedule Appointment',
  description:
    'Reschedule an appointment to a different time or to a different staff',
  audience: 'human',
  aiMetadata: {
    description:
      'Move an existing Zoho Bookings appointment, identified by its booking ID, to a new start time and/or reassign it to a different staff member or group. Supply at least one of new start time, staff, or group. Use the from/to time range only to look up the booking ID to act on. Not idempotent: it mutates the booking each time, though repeating with the same target is effectively a no-op once applied.',
    idempotent: false,
  },
  props: {
    from_time: Property.DateTime({
      displayName: 'From Time',
      description:
        'Start of the date range used to fetch existing bookings (to help you select the Booking ID to reschedule). Not sent to the reschedule API. Format: dd-MMM-yyyy HH:mm:ss',
      required: true,
    }),
    to_time: Property.DateTime({
      displayName: 'To Time',
      description:
        'End of the date range used to fetch existing bookings (optional). Not sent to the reschedule API. Format: dd-MMM-yyyy HH:mm:ss',
      required: false,
    }),
    booking_id: zohoBookingsProps.bookingId({ required: true }),
    service_id: zohoBookingsProps.anyServiceId({ required: false }),
    staff_id: zohoBookingsProps.anyStaffId({
      required: false,
      description:
        'Select the staff to reschedule to (use this OR group_id OR start_time)',
    }),
    group_id: Property.ShortText({
      displayName: 'Group ID',
      description:
        'The unique ID of the staff group to reschedule to (use this OR staff_id OR start_time)',
      required: false,
    }),
    start_time: Property.DateTime({
      displayName: 'New Start Time',
      description:
        'The new time to reschedule the appointment to (format: dd-MMM-yyyy HH:mm:ss, use this OR staff_id OR group_id)',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    await propsValidation.validateZod(propsValue, schema);

    if (!propsValue.staff_id && !propsValue.group_id && !propsValue.start_time) {
      throw new Error('Either staff_id, group_id, or start_time must be provided');
    }

    return await zohoBookingsApi.rescheduleAppointment({
      auth,
      bookingId: propsValue.booking_id,
      staffId: propsValue.staff_id,
      groupId: propsValue.group_id,
      startTime: propsValue.start_time,
    });
  },
});

const schema = {
  booking_id: z.string().check(z.minLength(1)),
  service_id: z.optional(z.string()),
  staff_id: z.optional(z.string()),
  group_id: z.optional(z.string()),
  start_time: z.optional(z.string()),
};
