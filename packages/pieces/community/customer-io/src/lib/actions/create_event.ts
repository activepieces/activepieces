import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { customerIOAuth } from '../auth';
import { customerIOCommon } from '../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createEvent = createAction({
  auth: customerIOAuth,
  name: 'create_event',
  classification: 'WRITE',
  displayName: 'Create Event',
  description: 'Record an event for a person in Customer.io',
  audience: 'both',
  aiMetadata: { description: 'Sends a behavioral/tracking event for a specific person to Customer.io via the Track API, identified by id, email, or cio_id per the workspace setting. Use to record that a customer did something so it can drive campaigns or segments. Provide the event payload either as key-value pairs or a raw JSON object (body_type). Not idempotent: each call appends a new event, even with identical input.', idempotent: false },
  propertyGroups: [
    {
      key: 'person',
      display: 'section',
      label: 'Person',
      icon: 'user',
      props: ['customer_identifier'],
    },
    {
      key: 'event',
      display: 'section',
      label: 'Event',
      icon: 'tag',
      props: ['event_name', 'body_type', 'body'],
    },
  ],
  props: {
    customer_identifier: Property.ShortText({
      displayName: 'Customer Identifier',
      description: "The person's ID, email or cio_id, depending on your workspace.",
      placeholder: 'jane@example.com',
      required: true,
    }),
    event_name: Property.ShortText({
      displayName: 'Event Name',
      description: 'The name you use for this event in campaigns and segments.',
      placeholder: 'purchased',
      required: true,
    }),
    body_type: Property.StaticDropdown({
      displayName: 'Data Format',
      required: false,
      description: "How you want to enter the event's data.",
      defaultValue: 'key_value',
      options: {
        disabled: false,
        options: [
          {
            label: 'Key-Value Pairs',
            value: 'key_value',
          },
          {
            label: 'JSON',
            value: 'json',
          },
        ],
      },
    }),
    body: Property.DynamicProperties({
      auth: customerIOAuth,
      displayName: 'Event Data',
      refreshers: ['body_type'],
      required: false,
      props: async ({ body_type }) => {
        if (!body_type) return {};

        const bodyTypeInput = body_type as unknown as string;

        const fields: DynamicPropsValue = {};

        switch (bodyTypeInput) {
          case 'json':
            fields['data'] = Property.Json({
              displayName: 'Event Data',
              description: 'A JSON object of attributes saved with the event.',
              required: true,
            });
            break;
          case 'key_value':
            fields['data'] = Property.Object({
              displayName: 'Event Data',
              description: 'Attributes saved with the event, for messages and segments.',
              required: true,
            });
            break;
        }
        return fields;
      },
    }),
  },
  async run(context) {
    const {
      body,
      body_type,
    } = context.propsValue;

    const basic_track_api = `${
      Buffer.from(
        `${context.auth.props.track_site_id}:${context.auth.props.track_api_key}`,
        'utf8'
      ).toString('base64')
    }`

    const headers = {
      Authorization: `Basic ${basic_track_api}`,
      'Content-Type': 'application/json',
    }
    const encoded_email = encodeURIComponent(context.propsValue.customer_identifier);
    const url = customerIOCommon[context.auth.props.region || 'us'].trackUrl + 'customers/' + encoded_email + '/events';

    const httprequestdata = {
      method: HttpMethod.POST,
      url,
      headers,
      body: {
        name: context.propsValue.event_name,
        data: body ? body['data'] : {},
      },
    }
    return await httpClient.sendRequest(httprequestdata);
  },
})
