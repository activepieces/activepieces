import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { zohoBookingsAuth } from '../auth';
import { zohoBookingsApi } from '../common/api';
import { zohoBookingsProps } from '../common/props';
import { getAppointmentDetailsOutputSchema } from '../output-schemas';

export const getAppointmentDetailsAction = createAction({
  auth: zohoBookingsAuth,
  name: 'getAppointmentDetails',
  outputSchema: getAppointmentDetailsOutputSchema,
  classification: 'READ',
  displayName: 'Get Appointment Details',
  description: 'Get details of an appointment using its booking ID',
  audience: 'human',
  aiMetadata: {
    description:
      'Retrieve the full details of a single Zoho Bookings appointment by its booking ID. Use the from/to time range to locate the booking ID first. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    from_time: Property.DateTime({
      displayName: 'From Time',
      description: 'The start time of the appointment (in ISO 8601 format)',
      required: true,
    }),
    to_time: Property.DateTime({
      displayName: 'To Time',
      description: 'The end time of the appointment (in ISO 8601 format)',
      required: false,
    }),
    booking_id: zohoBookingsProps.bookingId({ required: true }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    await propsValidation.validateZod(propsValue, schema);

    return await zohoBookingsApi.getAppointment({
      auth,
      bookingId: propsValue.booking_id,
    });
  },
});

const schema = {
  booking_id: z.string().check(z.minLength(1)),
};
