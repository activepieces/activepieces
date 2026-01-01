import { createAction, Property } from '@activepieces/pieces-framework';
import { motiontoolsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const create2stopBooking = createAction({
  auth: motiontoolsAuth,
  name: 'create2stopBooking',
  displayName: 'Create 2-stop Booking',
  description: 'Create a hailing booking with two stops (pickup + dropoff).',
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
    additional_information: Property.LongText({
      displayName: 'Additional Information',
      description: 'Any extra notes for the booking (optional)',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Additional metadata for the booking (optional)',
      required: false,
    }),
    // Stop 1 (pickup)
    stop1_type: Property.ShortText({
      displayName: 'Stop 1 Type',
      required: false,
    }),
    stop1_metadata: Property.Json({
      displayName: 'Stop 1 Metadata',
      required: false,
    }),
    stop1_lat: Property.Number({
      displayName: 'Stop 1 Latitude',
      required: false,
    }),
    stop1_lng: Property.Number({
      displayName: 'Stop 1 Longitude',
      required: false,
    }),
    stop1_street: Property.ShortText({
      displayName: 'Stop 1 Street',
      required: false,
    }),
    stop1_number: Property.ShortText({
      displayName: 'Stop 1 Street Number',
      required: false,
    }),
    stop1_city: Property.ShortText({
      displayName: 'Stop 1 City',
      required: false,
    }),
    stop1_country: Property.ShortText({
      displayName: 'Stop 1 Country',
      required: false,
    }),
    stop1_zip_code: Property.ShortText({
      displayName: 'Stop 1 Postal Code',
      required: false,
    }),
    stop1_additional_line: Property.ShortText({
      displayName: 'Stop 1 Address Additional Line',
      required: false,
    }),
    stop1_location_name: Property.ShortText({
      displayName: 'Stop 1 Location Name',
      required: false,
    }),
    stop1_first_name: Property.ShortText({
      displayName: 'Stop 1 Contact First Name',
      required: false,
    }),
    stop1_last_name: Property.ShortText({
      displayName: 'Stop 1 Contact Last Name',
      required: false,
    }),
    stop1_phone_number: Property.ShortText({
      displayName: 'Stop 1 Contact Phone',
      required: false,
    }),
    stop1_email: Property.ShortText({
      displayName: 'Stop 1 Contact Email',
      required: false,
    }),
    // Stop 2 (dropoff)
    stop2_type: Property.ShortText({
      displayName: 'Stop 2 Type',
      required: false,
    }),
    stop2_metadata: Property.Json({
      displayName: 'Stop 2 Metadata',
      required: false,
    }),
    stop2_lat: Property.Number({
      displayName: 'Stop 2 Latitude',
      required: false,
    }),
    stop2_lng: Property.Number({
      displayName: 'Stop 2 Longitude',
      required: false,
    }),
    stop2_street: Property.ShortText({
      displayName: 'Stop 2 Street',
      required: false,
    }),
    stop2_number: Property.ShortText({
      displayName: 'Stop 2 Street Number',
      required: false,
    }),
    stop2_city: Property.ShortText({
      displayName: 'Stop 2 City',
      required: false,
    }),
    stop2_country: Property.ShortText({
      displayName: 'Stop 2 Country',
      required: false,
    }),
    stop2_zip_code: Property.ShortText({
      displayName: 'Stop 2 Postal Code',
      required: false,
    }),
    stop2_additional_line: Property.ShortText({
      displayName: 'Stop 2 Address Additional Line',
      required: false,
    }),
    stop2_location_name: Property.ShortText({
      displayName: 'Stop 2 Location Name',
      required: false,
    }),
    stop2_first_name: Property.ShortText({
      displayName: 'Stop 2 Contact First Name',
      required: false,
    }),
    stop2_last_name: Property.ShortText({
      displayName: 'Stop 2 Contact Last Name',
      required: false,
    }),
    stop2_phone_number: Property.ShortText({
      displayName: 'Stop 2 Contact Phone',
      required: false,
    }),
    stop2_email: Property.ShortText({
      displayName: 'Stop 2 Contact Email',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      scheduled_at,
      payment_method,
      additional_information,
      metadata,
      stop1_type,
      stop1_metadata,
      stop1_lat,
      stop1_lng,
      stop1_street,
      stop1_number,
      stop1_city,
      stop1_country,
      stop1_zip_code,
      stop1_additional_line,
      stop1_location_name,
      stop1_first_name,
      stop1_last_name,
      stop1_phone_number,
      stop1_email,
      stop2_type,
      stop2_metadata,
      stop2_lat,
      stop2_lng,
      stop2_street,
      stop2_number,
      stop2_city,
      stop2_country,
      stop2_zip_code,
      stop2_additional_line,
      stop2_location_name,
      stop2_first_name,
      stop2_last_name,
      stop2_phone_number,
      stop2_email,
    } = propsValue;

    const booking: any = {};

    if (scheduled_at) booking.scheduled_at = scheduled_at;
    booking.payment_method = payment_method;
    if (additional_information)
      booking.additional_information = additional_information;
    if (metadata) booking.metadata = metadata;

    const stop1: any = {
      type: stop1_type || 'pickup',
      flow: 'full',
    };
    if (stop1_metadata) stop1.metadata = stop1_metadata;
    if (typeof stop1_lat === 'number') stop1.lat = stop1_lat;
    if (typeof stop1_lng === 'number') stop1.lng = stop1_lng;
    if (stop1_street) stop1.street = stop1_street;
    if (stop1_number) stop1.number = stop1_number;
    if (stop1_city) stop1.city = stop1_city;
    if (stop1_country) stop1.country = stop1_country;
    if (stop1_zip_code) stop1.zip_code = stop1_zip_code;
    if (stop1_additional_line) stop1.additional_line = stop1_additional_line;
    if (stop1_location_name) stop1.location_name = stop1_location_name;
    if (stop1_first_name) stop1.first_name = stop1_first_name;
    if (stop1_last_name) stop1.last_name = stop1_last_name;
    if (stop1_phone_number) stop1.phone_number = stop1_phone_number;
    if (stop1_email) stop1.email = stop1_email;

    const stop2: any = {
      type: stop2_type || 'dropoff',
      flow: 'full',
    };
    if (stop2_metadata) stop2.metadata = stop2_metadata;
    if (typeof stop2_lat === 'number') stop2.lat = stop2_lat;
    if (typeof stop2_lng === 'number') stop2.lng = stop2_lng;
    if (stop2_street) stop2.street = stop2_street;
    if (stop2_number) stop2.number = stop2_number;
    if (stop2_city) stop2.city = stop2_city;
    if (stop2_country) stop2.country = stop2_country;
    if (stop2_zip_code) stop2.zip_code = stop2_zip_code;
    if (stop2_additional_line) stop2.additional_line = stop2_additional_line;
    if (stop2_location_name) stop2.location_name = stop2_location_name;
    if (stop2_first_name) stop2.first_name = stop2_first_name;
    if (stop2_last_name) stop2.last_name = stop2_last_name;
    if (stop2_phone_number) stop2.phone_number = stop2_phone_number;
    if (stop2_email) stop2.email = stop2_email;

    booking.stops = [stop1, stop2];

    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      '/hailing/bookings',
      { booking }
    );

    return response;
  },
});
