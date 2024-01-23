import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { moxieCRMAuth } from '../..';

export const moxieCreateClientAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_create_client',
  displayName: 'Create a Client',
  description: 'Create a new client record in moxie CRM.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    clientType: Property.StaticDropdown({
      displayName: 'Client Type',
      required: true,
      defaultValue: 'Client',
      options: {
        disabled: false,
        options: [
          {
            label: 'Client',
            value: 'Client',
          },
          {
            label: 'Prospect',
            value: 'Prospect',
          },
        ],
      },
    }),
    initials: Property.ShortText({
      displayName: 'Initials',
      required: false,
    }),
    address1: Property.ShortText({
      displayName: 'Address 1',
      required: false,
    }),
    address2: Property.ShortText({
      displayName: 'Address 2',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    locality: Property.ShortText({
      displayName: 'Locality',
      required: false,
    }),
    postal: Property.ShortText({
      displayName: 'Postal',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      required: false,
      description: 'ISO 3166-1 alpha-2 country code',
    }),
    website: Property.ShortText({
      displayName: 'Website',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      required: false,
    }),
    taxId: Property.ShortText({
      displayName: 'Tax ID',
      required: false,
    }),
    leadSource: Property.ShortText({
      displayName: 'Lead Source',
      required: false,
    }),
    archive: Property.Checkbox({
      displayName: 'Archive ?',
      required: true,
      defaultValue: false,
    }),
    payInstructions: Property.LongText({
      displayName: 'Pay Instructions',
      required: false,
    }),
    hourlyAmount: Property.Number({
      displayName: 'Hourly Amount',
      required: false,
    }),
    roundingIncrement: Property.Number({
      displayName: 'Rounding Increment',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      required: false,
      description: 'Valid 3-Letter ISO 4217 currency code.',
    }),
    stripeClientId: Property.ShortText({
      displayName: 'Stripe Client ID',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = await makeClient(auth);
    return await client.createClient(propsValue);
  },
});
