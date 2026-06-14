import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import { businessAccountIdProp, phoneNumberIdDropdown } from '../common/props';

export const sendLocation = createAction({
  auth: kapsoAuth,
  name: 'send_location',
  displayName: 'Send Location',
  description: 'Send a location message via WhatsApp.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a geographic location (latitude and longitude, optionally with a name and address) to a WhatsApp recipient as a map pin. Use to share a place; to ask the recipient for their own location instead, use Request User Location. Each call delivers a new message, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    businessAccountId: businessAccountIdProp,
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
