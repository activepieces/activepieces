import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import {
  businessAccountIdProp,
  freeFormWindowInfo,
  phoneNumberIdDropdown,
  recipientPhoneProp,
} from '../common/props';

export const sendLocation = createAction({
  auth: kapsoAuth,
  name: 'send_location',
  classification: 'WRITE',
  displayName: 'Send Location',
  description: 'Send a location message via WhatsApp.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a geographic location (latitude and longitude, optionally with a name and address) to a WhatsApp recipient as a map pin. Use to share a place; to ask the recipient for their own location instead, use Request User Location. Each call delivers a new message, so it is not idempotent.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'sender',
      display: 'section',
      label: 'Send From',
      icon: 'send',
      props: ['businessAccountId', 'phoneNumberId'],
    },
    {
      key: 'recipient',
      display: 'section',
      label: 'Send To',
      icon: 'user',
      props: ['windowInfo', 'to'],
    },
    {
      key: 'location',
      display: 'section',
      label: 'Location',
      icon: 'location',
      props: ['latitude', 'longitude', 'name', 'address'],
    },
  ],
  props: {
    businessAccountId: businessAccountIdProp,
    phoneNumberId: phoneNumberIdDropdown,
    windowInfo: freeFormWindowInfo,
    to: recipientPhoneProp,
    latitude: Property.Number({
      displayName: 'Latitude',
      description: 'Between -90 and 90.',
      required: true,
      width: 'half',
    }),
    longitude: Property.Number({
      displayName: 'Longitude',
      description: 'Between -180 and 180.',
      required: true,
      width: 'half',
    }),
    name: Property.ShortText({
      displayName: 'Location Name',
      description: 'Shown in bold above the address.',
      placeholder: 'Head Office',
      required: false,
    }),
    address: Property.ShortText({
      displayName: 'Address',
      description: 'Shown under the location name.',
      placeholder: '1 Market St, San Francisco, CA',
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
