import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { talkableAuth } from '../../..';

export const updatePerson = createAction({
  name: 'update_person', // Must be a unique across the piece, this shouldn't be changed.
  auth: talkableAuth,
  displayName: 'Update person',
  description: 'Update person by email',
  props: {
    email: Property.ShortText({
      displayName: 'Person email',
      description: undefined,
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'Person first name',
      description: undefined,
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Person last name',
      description: undefined,
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Person phone number',
      description: undefined,
      required: false,
    }),
    username: Property.ShortText({
      displayName: 'Person username',
      description: undefined,
      required: false,
    }),
    customer_id: Property.Number({
      displayName: 'Customer ID',
      description: undefined,
      required: false,
    }),
    custom_properties: Property.Object({
      displayName: 'Custom properties',
      description: undefined,
      required: false,
    }),
    gated_param_subscribed: Property.Checkbox({
      displayName: 'Opt-in status',
      description: undefined,
      required: false,
    }),
    unsubscribed: Property.Checkbox({
      displayName: 'Unsubscribe status',
      description: undefined,
      required: false,
    }),
    unsubscribed_at: Property.DateTime({
      displayName: 'Unsubscribed date',
      description: undefined,
      required: false,
    })
  },
  async run(context) {
    const TALKABLE_API_URL = 'https://www.talkable.com/api/v2';
    const { site, api_key } = context.auth;
    type Fields = {
      [key: string]: any;
    };

    let fields:Fields = {
      email: context.propsValue['email'],
      first_name: context.propsValue['first_name'],
      last_name: context.propsValue['last_name'],
      phone_number: context.propsValue['phone_number'],
      username: context.propsValue['username'],
      customer_id: context.propsValue['customer_id'],
      custom_properties: context.propsValue['custom_properties'],
      gated_param_subscribed: context.propsValue['gated_param_subscribed'],
      unsubscribed: context.propsValue['unsubscribed'],
      unsubscribed_at: context.propsValue['unsubscribed_at']
    };


    const keys = Object.keys(fields);
    for (var i = 0; i < keys.length; ++i) {
      const key:string = keys[i];
      const value = fields[key];
      if (value === null || value === undefined || value === '') {
        delete fields[key];
      }
    }

    const personUpdateResponse = await httpClient.sendRequest<string[]>({
      method: HttpMethod.PUT,
      url: `${TALKABLE_API_URL}/people/${context.propsValue['email']}`,
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'Content-Type': 'application/json'
      },
      body: {
        site_slug: site,
        data: fields
      }
    });
    return personUpdateResponse.body;
  },
});
