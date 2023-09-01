import {
  createAction,
  Property,
  Validators,
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
      processors: [],
      validators: [Validators.email],
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
      description: undefined,
      required: false,
      defaultValue: [
        { price:10, quantity:1, product_id:'SKU1', },
        { price:20, quantity:1, product_id:'SKU2', }
      ],
    }),
  },
  async run(context) {
    const TALKABLE_API_URL = 'https://www.talkable.com/api/v2';
    const { site, api_key } = context.auth;
    type Fields = {
      [key: string]: any;
    };
    let fields:Fields = {
      email: context.propsValue['email'],
      event_number: context.propsValue['event_number'],
      event_category: context.propsValue['event_category'],
      subtotal: context.propsValue['subtotal'],
      first_name: context.propsValue['first_name'],
      last_name: context.propsValue['last_name'],
      username: context.propsValue['username'],
      customer_id: context.propsValue['customer_id'],
      custom_properties: context.propsValue['custom_properties'],
      phone_number: context.propsValue['phone_number'],
      campaign_tags: context.propsValue['campaign_tags'],
      sharing_channels: context.propsValue['sharing_channels'],
      ip_address: context.propsValue['ip_address'],
      uuid: context.propsValue['uuid'],
      created_at: context.propsValue['created_at'],
      traffic_source: context.propsValue['traffic_source'],
      coupon_codes: context.propsValue['coupon_codes'],
      currency_iso_code: context.propsValue['currency_iso_code'],
      shipping_address: context.propsValue['shipping_address'],
      shipping_zip: context.propsValue['shipping_zip'],
      items: context.propsValue['items'],
    };


    const keys = Object.keys(fields);
    for (var i = 0; i < keys.length; ++i) {
      const key:string = keys[i];
      const value = fields[key];
      if (value === null || value === undefined || value === '') {
        delete fields[key];
      }
    }

    const createEventResponse = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: `${TALKABLE_API_URL}/origins/event`,
      headers: {
        Authorization: `Bearer ${api_key}`,
        'Content-Type': 'application/json',
      },
      body: {
        site_slug: site,
        data: fields,
      },
    });
    return createEventResponse.body;
  },
});
