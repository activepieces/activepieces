import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calComApiCall } from '../common';

export const rescheduleBooking = createAction({
  auth: calcomAuth,
  name: 'reschedule_booking',
  displayName: 'Reschedule Booking',
  description: 'Reschedule an existing booking to a new time',
  props: {
    bookingUid: Property.ShortText({
      displayName: 'Booking UID',
      description: 'The unique identifier of the booking to reschedule',
      required: true,
    }),
    newStartTime: Property.DateTime({
      displayName: 'New Start Time',
      description: 'The new start time for the booking (UTC)',
      required: true,
    }),
    reschedulingReason: Property.LongText({
      displayName: 'Rescheduling Reason',
      description: 'Reason for rescheduling the booking',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { bookingUid, newStartTime, reschedulingReason } = propsValue;

    const body: Record<string, unknown> = {
      start: new Date(newStartTime).toISOString(),
    };

    if (reschedulingReason) {
      body['reschedulingReason'] = reschedulingReason;
    }

    const response = await calComApiCall<{
      status: string;
      data: unknown;
    }>(auth.secret_text, HttpMethod.POST, `/bookings/${bookingUid}/reschedule`, body);

    return response;
  },
});
