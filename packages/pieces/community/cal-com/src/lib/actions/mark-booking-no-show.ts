import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { bookingActionOutputSchema } from '../output-schemas';

function toOptionalBoolean(value: string | undefined): boolean | undefined {
  return value === undefined ? undefined : value === 'true';
}

const YES_NO_OPTIONS = {
  options: [
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' },
  ],
};

export const calcomMarkBookingNoShow = createAction({
  auth: calcomAuth,
  name: 'calcom_mark_booking_no_show',
  classification: 'WRITE',
  displayName: 'Mark Booking No-Show',
  description: 'Mark the host and/or a specific attendee absent for a Cal.com booking.',
  audience: 'ai',
  outputSchema: bookingActionOutputSchema,
  aiMetadata: {
    description:
      'Flags whether the host and/or one attendee (by email) were absent for a booking. At least one of Host Absent or Attendee Email must be set. Idempotent: re-applying the same absent flag is a no-op.',
    idempotent: true,
  },
  props: {
    booking_uid: Property.ShortText({
      displayName: 'Booking UID',
      required: true,
    }),
    host_absent: Property.StaticDropdown({
      displayName: 'Host Absent',
      required: false,
      options: YES_NO_OPTIONS,
    }),
    attendee_email: Property.ShortText({
      displayName: 'Attendee Email',
      description: 'Leave empty to only set Host Absent.',
      required: false,
    }),
    attendee_absent: Property.StaticDropdown({
      displayName: 'Attendee Absent',
      description: 'Only used together with Attendee Email. Defaults to Yes.',
      required: false,
      options: YES_NO_OPTIONS,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { booking_uid, host_absent, attendee_email, attendee_absent } = propsValue;

    const body: Record<string, unknown> = {};
    const hostValue = toOptionalBoolean(host_absent);
    if (hostValue !== undefined) body['host'] = hostValue;
    if (attendee_email !== undefined) {
      body['attendees'] = [
        {
          email: attendee_email,
          absent: toOptionalBoolean(attendee_absent) ?? true,
        },
      ];
    }

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: `/bookings/${booking_uid}/mark-absent`,
      version: calcomCommon.versions.bookingsItem,
      body,
    });
  },
});
