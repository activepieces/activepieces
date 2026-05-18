import { createAction, Property } from '@activepieces/pieces-framework';
import { motiontoolsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const create1stopBooking = createAction({
  auth: motiontoolsAuth,
  name: 'create1stopBooking',
  displayName: 'Create 1-stop Booking',
  description: 'Create a hailing booking (1-stop).',
  props: {
    scheduled_at: Property.ShortText({
      displayName: 'Scheduled At',
      description: 'Scheduled datetime (ISO 8601) for the booking (optional)',
      required: false,
    }),
    payment_method: Property.ShortText({
      displayName: 'Payment Method',
      description: 'Payment method (e.g. cash, card)',
      required: true,
    }),
    stop_type: Property.ShortText({
      displayName: 'Stop Type',
      description: 'Type of stop (e.g. pickup, dropoff)',
      required: false,
    }),

    stop_lat: Property.Number({
      displayName: 'Latitude',
      description: 'Latitude for the stop (optional)',
      required: false,
    }),
    stop_lng: Property.Number({
      displayName: 'Longitude',
      description: 'Longitude for the stop (optional)',
      required: false,
    }),
    stop_street: Property.ShortText({
      displayName: 'Street',
      description: 'Street name for the stop (optional)',
      required: false,
    }),
    stop_number: Property.ShortText({
      displayName: 'Street Number',
      description: 'Street number for the stop (optional)',
      required: false,
    }),
    stop_city: Property.ShortText({
      displayName: 'City',
      description: 'City for the stop (optional)',
      required: false,
    }),
    stop_country: Property.ShortText({
      displayName: 'Country',
      description: 'Country for the stop (optional)',
      required: false,
    }),
    stop_zip_code: Property.ShortText({
      displayName: 'Postal Code',
      description: 'Postal code for the stop (optional)',
      required: false,
    }),
    stop_additional_line: Property.ShortText({
      displayName: 'Address Additional Line',
      description: 'Additional address line for the stop (optional)',
      required: false,
    }),
    stop_location_name: Property.ShortText({
      displayName: 'Location Name',
      description: 'Location name for the stop (optional)',
      required: false,
    }),
    stop_first_name: Property.ShortText({
      displayName: 'Contact First Name',
      description: "Contact's first name at the stop (optional)",
      required: false,
    }),
    stop_last_name: Property.ShortText({
      displayName: 'Contact Last Name',
      description: "Contact's last name at the stop (optional)",
      required: false,
    }),
    stop_phone_number: Property.ShortText({
      displayName: 'Contact Phone Number',
      description: "Contact's phone number (optional)",
      required: false,
    }),
    stop_email: Property.ShortText({
      displayName: 'Contact Email',
      description: "Contact's email (optional)",
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      scheduled_at,
      payment_method,
      stop_type,
      stop_lat,
      stop_lng,
      stop_street,
      stop_number,
      stop_city,
      stop_country,
      stop_zip_code,
      stop_additional_line,
      stop_location_name,
      stop_first_name,
      stop_last_name,
      stop_phone_number,
      stop_email,
    } = propsValue;

    const booking: any = {};

    if (scheduled_at) booking.scheduled_at = scheduled_at;
    booking.payment_method = payment_method;

    const stop: any = {
      type: stop_type || 'pickup',
      flow: 'full',
    };

    if (typeof stop_lat === 'number') stop.lat = stop_lat;
    if (typeof stop_lng === 'number') stop.lng = stop_lng;
    if (stop_street) stop.street = stop_street;
    if (stop_number) stop.number = stop_number;
    if (stop_city) stop.city = stop_city;
    if (stop_country) stop.country = stop_country;
    if (stop_zip_code) stop.zip_code = stop_zip_code;
    if (stop_additional_line) stop.additional_line = stop_additional_line;
    if (stop_location_name) stop.location_name = stop_location_name;
    if (stop_first_name) stop.first_name = stop_first_name;
    if (stop_last_name) stop.last_name = stop_last_name;
    if (stop_phone_number) stop.phone_number = stop_phone_number;
    if (stop_email) stop.email = stop_email;

    booking.stops = [stop];

    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.POST,
        '/hailing/bookings',
        { booking }
      );

      return response;
    } catch (error) {
      throw new Error(
        `Failed to create booking: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
});
