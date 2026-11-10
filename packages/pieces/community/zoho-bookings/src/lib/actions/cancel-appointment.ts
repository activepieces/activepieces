import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { zohoBookingsAuth } from '../auth';
import { zohoBookingsApi } from '../common/api';
import { zohoBookingsProps } from '../common/props';
import { getAppointmentDetailsOutputSchema } from '../output-schemas';

export const cancelAppointmentAction = createAction({
  auth: zohoBookingsAuth,
  name: 'cancelAppointment',
  outputSchema: getAppointmentDetailsOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel Appointment',
  description:
    'Update the status of a booking (cancel, complete, or mark as no-show)',
  audience: 'human',
  aiMetadata: {
    description:
      'Cancel an existing Zoho Bookings appointment identified by its booking ID. Use the from/to time range to locate the booking ID first. Not idempotent: it submits a status-change request each call, though re-cancelling an already-cancelled booking has no further effect.',
    idempotent: false,
  },
  props: {
    from_time: Property.DateTime({
      displayName: 'From Time',
      description:
        'The starting time for the appointment (format: mm-dd-yyyy HH:mm:ss)',
      required: true,
    }),
    to_time: Property.DateTime({
      displayName: 'To Time',
      description:
        'The ending time for the appointment (format: mm-dd-yyyy HH:mm:ss)',
      required: false,
    }),
    booking_id: zohoBookingsProps.bookingId({ required: true }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    await propsValidation.validateZod(propsValue, schema);

    return await zohoBookingsApi.cancelAppointment({
      auth,
      bookingId: propsValue.booking_id,
    });
  },
});

const schema = {
  booking_id: z.string().check(z.minLength(1)),
};
