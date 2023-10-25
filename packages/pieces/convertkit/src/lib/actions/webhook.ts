import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import { CONVERTKIT_API_URL } from '../common';

export const API_ENDPOINT = 'automations/hooks/';

const createWebhookParameterOptions = [
  {
    label: 'Subscriber activated',
    value: 'subscriber.subscriber_activate',
    required_parameter: null,
  },
  {
    label: 'Subscriber unsubscribed',
    value: 'subscriber.subscriber_unsubscribe',
    required_parameter: null,
    param_label: null,
    type: null,
  },
  {
    label: 'Subscriber bounced',
    value: 'subscriber.subscriber_bounce',
    required_parameter: null,
    param_label: null,
    type: null,
  },
  {
    label: 'Subscriber complained',
    value: 'subscriber.subscriber_complain',
    required_parameter: null,
    param_label: null,
    type: null,
  },
  {
    label: 'Form subscribed',
    value: 'subscriber.form_subscribe',
    required_parameter: 'form_id',
    param_label: 'Form Id',
    type: 'number',
  },
  {
    label: 'Course subscribed',
    value: 'subscriber.course_subscribe',
    required_parameter: 'course_id',
    param_label: 'Course Id',
    type: 'number',
  },
  {
    label: 'Course completed',
    value: 'subscriber.course_complete',
    required_parameter: 'course_id',
    param_label: 'Course Id',
    type: 'number',
  },
  {
    label: 'Link clicked',
    value: 'subscriber.link_click',
    required_parameter: 'initiator_value',
    param_label: 'Initiator Value',
    type: 'string',
  },
  {
    label: 'Product purchased',
    value: 'subscriber.product_purchase',
    required_parameter: 'product_id',
    param_label: 'Product Id',
    type: 'number',
  },
  {
    label: 'Tag added to subscriber',
    value: 'subscriber.tag_add',
    required_parameter: 'tag_id',
    param_label: 'Tag Id',
    type: 'number',
  },
  {
    label: 'Tag removed from subscriber',
    value: 'subscriber.tag_remove',
    required_parameter: 'tag_id',
    param_label: 'Tag Id',
    type: 'number',
  },
];

export const createWebhook = createAction({
  auth: convertkitAuth,
  name: 'create_webhook',
  displayName: 'Webhook: Add Webhook',
  description: 'Create a webhook automation',
  props: {
    target_url: Property.ShortText({
      displayName: 'Target URL',
      description: 'The URL that will be called when the webhook is triggered',
      required: true,
    }),
    event: Property.StaticDropdown({
      displayName: 'Event',
      description: 'The event that will trigger the webhook',
      required: true,
      options: {
        options: createWebhookParameterOptions,
      },
    }),
    event_parameter: Property.DynamicProperties({
      displayName: 'Event Parameter',
      description: 'The parameter for the event',
      required: false,
      refreshers: ['event'],
      props: async ({ event }) => {
        if (!event) {
          return {
            disabled: true,
            placeholder: 'Select event first',
            options: [],
          };
        }

        const fields: DynamicPropsValue = {};

        const eventOption = createWebhookParameterOptions.find(
          (option) =>
            option.value === (event as unknown as string) &&
            option.required_parameter
        );

        if (!eventOption) {
          return fields;
        }

        const required_parameter = eventOption['required_parameter'] || '';
        const param_label = eventOption['param_label'] || '';
        const fieldType = eventOption['type'];
        const field = {
          displayName: param_label,
          description: `The ${param_label} parameter for the event`,
          required: true,
        };

        if (fieldType === 'number') {
          fields[required_parameter] = Property.Number(field);
        }
        if (fieldType === 'string') {
          fields[required_parameter] = Property.ShortText(field);
        }

        return fields;
      },
    }),
  },
  async run(context) {
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}`;

    const event = {
      event: {
        name: context.propsValue.event,
        ...context.propsValue.event_parameter,
      },
      target_url: context.propsValue.target_url,
    };

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ ...event, api_secret: context.auth }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

export const destroyWebhook = createAction({
  auth: convertkitAuth,
  name: 'destroy_webhook',
  displayName: 'Webhook: Destroy Webhook',
  description: 'Destroy a webhook automation',
  props: {
    webhookId: Property.ShortText({
      displayName: 'Webhook Id',
      description: 'The webhook rule id',
      required: false,
    }),
  },
  async run(context) {
    const { webhookId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}${webhookId}`;

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'DELETE',
      body: JSON.stringify({ api_secret: context.auth }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});
