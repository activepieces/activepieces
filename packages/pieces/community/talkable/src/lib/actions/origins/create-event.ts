import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { talkableAuth } from '../../..';

export const createEvent = createAction({
  name: 'create_event', // Must be a unique across the piece, this shouldn't be changed.
  auth: talkableAuth,
  displayName: 'Create event',
  description: 'Create event in Talkable',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: undefined,
      required: true,
    }),
    event_category: Property.ShortText({
      displayName: 'Event category',
      description: undefined,
      required: true,
    }),
    event_number: Property.ShortText({
      displayName: 'Event number',
      description: undefined,
      required: true,
    }),
    subtotal: Property.Number({
      displayName: 'Subtotal',
      description: undefined,
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First name',
      description: undefined,
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last name',
      description: undefined,
      required: false,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: undefined,
      required: false,
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer id',
      description: undefined,
      required: false,
    }),
    custom_properties: Property.Object({
      displayName: 'Custom properties',
      description: undefined,
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone number',
      description: undefined,
      required: false,
    }),
    campaign_tags: Property.ShortText({
      displayName: 'Campaign tags',
      description: undefined,
      required: false,
    }),
    sharing_channels: Property.Array({
      displayName: 'Sharing channels',
      description: undefined,
      required: false,
    }),
    ip_address: Property.ShortText({
      displayName: 'IP address',
      description: undefined,
      required: false,
    }),
    uuid: Property.ShortText({
      displayName: 'UUID',
      description: undefined,
      required: false,
    }),
    created_at: Property.ShortText({
      displayName: 'Created at',
      description: undefined,
      required: false,
    }),
    traffic_source: Property.ShortText({
      displayName: 'Traffic source',
      description: undefined,
      required: false,
    }),
    coupon_codes: Property.Array({
      displayName: 'Coupon codes',
      description: undefined,
      required: false,
    }),
    currency_iso_code: Property.ShortText({
      displayName: 'Currency iso code',
      description: 'Required for multi-currency sites',
      required: false,
      defaultValue: 'USD',
    }),
    shipping_address: Property.ShortText({
      displayName: 'Shipping address',
      description: undefined,
      required: false,
    }),
    shipping_zip: Property.ShortText({
      displayName: 'Shipping zip',
      description: undefined,
      required: false,
    }),
    items: Property.Json({
      displayName: 'Items',
      description: "You can pass items with event",
      required: false,
      defaultValue: [
        { price: 10, quantity: 1, product_id: 'SKU1' },
        { price: 20, quantity: 1, product_id: 'SKU2' },
      ],
    }),
  },
  async run(context) {
    const TALKABLE_API_URL = 'https://www.talkable.com/api/v2';
    const { site, api_key } = context.auth;
    const createEventResponse = await httpClient
      .sendRequest<string[]>({
        method: HttpMethod.POST,
        url: `${TALKABLE_API_URL}/origins/event`,
        headers: {
          Authorization: `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        },
        body: {
          site_slug: site,
          data: context.propsValue,
        },
      });
    return createEventResponse.body;
  },
});
