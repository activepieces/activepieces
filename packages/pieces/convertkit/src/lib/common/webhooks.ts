import {
  Property,
  DynamicPropsValue,
  NonAuthPieceProperty,
  Validators,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { Webhook, EventType, EventOption } from './models';
import { CONVERTKIT_API_URL } from './constants';
import { log } from '../common';
import { fetchTags } from './tags';
import { fetchForms } from './forms';
import { fetchSequences } from './sequences';

export const API_ENDPOINT = 'automations/hooks';

export const createWebhook = async (auth: string, payload: object) => {
  const body = { ...payload, api_secret: auth };

  const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}`;

  const request: HttpRequest = {
    url,
    body,
    method: HttpMethod.POST,
  };

  log({ request });

  const response = await httpClient.sendRequest<{ rule: Webhook }>(request);

  if (response.status !== 200) {
    throw new Error(
      `Failed to create webhook: ${response.status} ${response.body}`
    );
  }

  return response.body.rule;
};

export const removeWebhook = async (auth: string, ruleId: number) => {
  const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${ruleId}`;
  const body = { api_secret: auth };

  const request: HttpRequest = {
    url,
    body,
    method: HttpMethod.DELETE,
  };

  const response = await httpClient.sendRequest<{ success: boolean }>(request);

  if (response.status !== 200) {
    throw new Error(
      `Failed to remove webhook: ${response.status} ${response.body}`
    );
  }

  return response.body.success;
};

export const webhookBaseOverride = (): NonAuthPieceProperty => {
  if (process.env['AP_ENVIRONMENT'] !== 'dev') {
    // Returns empty property if not in dev environment
    return {} as NonAuthPieceProperty;
  }
  return Property.ShortText({
    displayName: 'Webhook Base Override (Dev mode)',
    description:
      'The base URL that will be used for webhooks. This is used for testing webhooks locally.',
    required: false,
    // defaultValue: 'https://3ee7307b6dd0.ngrok.app',
    validators: [Validators.url],
  });
};

export const initiatorValue = Property.ShortText({
  displayName: 'Initiator Value URL',
  description: 'The initiator value URL that will trigger the webhook',
  required: true,
});

export const prepareWebhookURL = (
  webhookUrl: string,
  webhookBaseOverride: string
) => {
  if (process.env['AP_ENVIRONMENT'] === 'dev') {
    return webhookUrl.replace('http://localhost:3000', webhookBaseOverride);
  }
  return targetUrl;
};

export const webhookId = Property.Number({
  displayName: 'Webhook Id',
  description: 'The webhook rule id',
  required: true,
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
  refreshers: ['auth', 'event'],
  props: async ({ auth, event }) => {
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

    const required_parameter = eventOption.required_parameter || '';
    const param_label = eventOption.param_label || '';
    const fieldType = eventOption.type || '';

    if (required_parameter === 'tag_id') {
      const tags = await fetchTags(auth.toString());
      const options = tags.map((tag) => {
        return {
          label: tag.name,
          value: tag.id,
        };
      });
      fields[required_parameter] = Property.StaticDropdown({
        displayName: 'Tag',
        description: 'Choose a Tag',
        required: true,
        options: {
          options,
        },
      });
      return fields;
    }

    if (required_parameter === 'form_id') {
      const forms = await fetchForms(auth.toString());
      const options = forms.map((form) => {
        return {
          label: form.name,
          value: form.id,
        };
      });
      fields[required_parameter] = Property.StaticDropdown({
        displayName: 'Form',
        description: 'Choose a Form',
        required: true,
        options: {
          options,
        },
      });
      return fields;
    }

    if (required_parameter === 'sequence_id') {
      const courses = await fetchSequences(auth.toString());
      const options = courses.map((sequence) => {
        return {
          label: sequence.name,
          value: sequence.id,
        };
      });
      fields[required_parameter] = Property.StaticDropdown({
        displayName: 'Sequence',
        description: 'Choose a Sequence',
        required: true,
        options: {
          options,
        },
      });
      return fields;
    }

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

export const createWebhookParameterOptions: EventOption[] = [
  {
    label: 'Subscriber activated',
    value: EventType.subscriberActivate,
    required_parameter: null,
    param_label: null,
    type: null,
  },
  {
    label: 'Subscriber unsubscribed',
    value: EventType.subscriberUnsubscribe,
    required_parameter: null,
    param_label: null,
    type: null,
  },
  {
    label: 'Subscriber bounced',
    value: EventType.subscriberBounce,
    required_parameter: null,
    param_label: null,
    type: null,
  },
  {
    label: 'Subscriber complained',
    value: EventType.subscriberComplain,
    required_parameter: null,
    param_label: null,
    type: null,
  },
  {
    label: 'Form subscribed',
    value: EventType.formSubscribe,
    required_parameter: 'form_id',
    param_label: 'Form Id',
    type: 'number',
  },
  {
    label: 'Sequence subscribed',
    value: EventType.courseSubscribe,
    required_parameter: 'sequence_id',
    param_label: 'Sequence Id',
    type: 'number',
  },
  {
    label: 'Sequence completed',
    value: EventType.courseComplete,
    required_parameter: 'sequence_id',
    param_label: 'Sequence Id',
    type: 'number',
  },
  {
    label: 'Link clicked',
    value: EventType.linkClick,
    required_parameter: 'initiator_value',
    param_label: 'Initiator Value',
    type: 'string',
  },
  {
    label: 'Product purchased',
    value: EventType.productPurchase,
    required_parameter: 'product_id',
    param_label: 'Product Id',
    type: 'number',
  },
  {
    label: 'Tag added to subscriber',
    value: EventType.tagAdd,
    required_parameter: 'tag_id',
    param_label: 'Tag Id',
    type: 'number',
  },
  {
    label: 'Tag removed from subscriber',
    value: EventType.tagRemove,
    required_parameter: 'tag_id',
    param_label: 'Tag Id',
    type: 'number',
  },
  {
    label: 'Purchase created',
    value: EventType.purchaseCreate,
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
