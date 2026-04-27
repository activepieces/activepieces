import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { buildRecipientBody, RecipientType } from '../../common/recipients';

export const sendLocationToContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_location_to_contact',
  displayName: 'Send a Location to a Contact',
  description: 'Send a GPS location pin to a WhatsApp contact',
  props: {
    session: whatsscaleProps.session,
    contact: whatsscaleProps.contact,
    latitude: Property.Number({
      displayName: 'Latitude',
      required: true,
      description: 'GPS latitude (-90 to 90)',
    }),
    longitude: Property.Number({
      displayName: 'Longitude',
      required: true,
      description: 'GPS longitude (-180 to 180)',
    }),
    title: Property.ShortText({
      displayName: 'Location Title',
      required: false,
      description: 'Optional label shown on the pin',
    }),
  },
  async run(context) {
    const { session, contact, latitude, longitude, title } = context.propsValue;
    const auth = context.auth.secret_text;

    const body = buildRecipientBody(RecipientType.CONTACT, session, contact);
    const response = await whatsscaleClient(
      auth,
      HttpMethod.POST,
      '/api/sendLocation',
      {
        ...body,
        latitude,
        longitude,
        ...(title ? { title } : {}),
        platform: 'activepieces',
      },
    );

    return response.body;
  },
});
