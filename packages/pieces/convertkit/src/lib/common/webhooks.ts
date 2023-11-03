import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { WEBHOOK_BASE_OVERRIDE, CONVERTKIT_API_URL } from './constants';

// ------------------> Trigger <------------------

export const onEnable = async (auth: string, payload: object) => {
  const body = JSON.stringify({ ...payload, api_secret: auth }, null, 2);

  const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}`;
  // Fetch URL using fetch api
  const response = await fetch(url, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Throw if unsuccessful
  if (!response.ok) {
    throw new Error('Failed to create webhook');
  }

  // Get response body
  const data = await response.json();
  const ruleId = data.rule.id;

  return ruleId;
};

export const onDisable = async (auth: string, ruleId: number) => {
  const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}${ruleId}`;
  // Fetch URL using fetch api
  const response = await fetch(url, {
    method: 'DELETE',
    body: JSON.stringify({ api_secret: auth }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Throw if unsuccessful
  if (!response.ok) {
    throw new Error('Failed to remove webhook');
  }
};

export const prepareWebhooURL = (webhookUrl: string) => {
  let targetUrl = webhookUrl;
  if (process.env['AP_ENVIRONMENT'] === 'dev') {
    targetUrl = webhookUrl.replace(
      'http://localhost:3000',
      WEBHOOK_BASE_OVERRIDE
    );
  }
  return targetUrl;
};

// ------------------> Actions <------------------

export const API_ENDPOINT = 'automations/hooks';

export const webhookId = Property.ShortText({
  displayName: 'Webhook Id',
  description: 'The webhook rule id',
  required: false,
});

export const targetUrl = Property.ShortText({
  displayName: 'Target URL',
  description: 'The URL that will be called when the webhook is triggered',
  required: true,
});

export const eventParameter = Property.DynamicProperties({
  displayName: 'Event Parameter',
  description: 'The required parameter for the event',
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
});

export const createWebhookParameterOptions = [
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
  {
    label: 'Purchase created',
    value: 'purchase.purchase_create',
    required_parameter: null,
    param_label: null,
    type: null,
  },
];

export const event = Property.StaticDropdown({
  displayName: 'Event',
  description: 'The event that will trigger the webhook',
  required: true,
  options: {
    options: createWebhookParameterOptions,
  },
});
