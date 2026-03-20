import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import { phoneNumberIdDropdown } from '../common/props';

export const sendLocation = createAction({
  auth: kapsoAuth,
  name: 'send_location',
  displayName: 'Send Location',
  description: 'Send a location message via WhatsApp.',
  props: {
    phoneNumberId: phoneNumberIdDropdown,
    to: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description:
        'The recipient\'s phone number in international format (e.g. 15551234567).',
      required: true,
    }),
    latitude: Property.Number({
      displayName: 'Latitude',
      description: 'Latitude of the location.',
      required: true,
    }),
    longitude: Property.Number({
      displayName: 'Longitude',
      description: 'Longitude of the location.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Location Name',
      description: 'Name of the location.',
      required: false,
    }),
    address: Property.ShortText({
      displayName: 'Address',
      description: 'Address of the location.',
      required: false,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, latitude, longitude, name, address } =
      context.propsValue;
    const client = makeClient(context.auth.secret_text);

    const response = await client.messages.sendLocation({
      phoneNumberId,
      to,
      location: {
        latitude,
        longitude,
        name: name ?? undefined,
        address: address ?? undefined,
      },
    });

    return response;
  },
});
