import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { EventType, EventOption } from '../types';
import { fetchTags, fetchForms, fetchSequences } from '../service';
import { convertkitAuth } from '../../auth';

export const initiatorValue = Property.ShortText({
  displayName: 'Link URL',
  description: 'The link in your email to watch for clicks.',
  placeholder: 'https://example.com/offer',
  required: true,
});

export const webhookId = Property.Number({
  displayName: 'Webhook ID',
  description: 'The ID Kit returned when the webhook was created.',
  required: true,
});

export const targetUrl = Property.ShortText({
  displayName: 'Target URL',
  description: 'Kit sends the event here.',
  placeholder: 'https://example.com/kit-webhook',
  required: true,
});

export const eventParameter = Property.DynamicProperties({
  displayName: 'Event Filter',
  description:
    'The tag, form, sequence, product or link the event applies to.',
  required: false,
  refreshers: ['auth', 'event'],
  auth: convertkitAuth,
  props: async ({ auth, event }) => {
    if (!event || !auth) {
      return {};
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
      const tags = await fetchTags(auth.secret_text);
      const options = tags.map((tag) => {
        return {
          label: tag.name,
          value: tag.id,
        };
      });
      fields[required_parameter] = Property.StaticDropdown({
        displayName: 'Tag',
        required: true,
        options: {
          options,
        },
      });
      return fields;
    }

    if (required_parameter === 'form_id') {
      const forms = await fetchForms(auth.secret_text);
      const options = forms.map((form) => {
        return {
          label: form.name,
          value: form.id,
        };
      });
      fields[required_parameter] = Property.StaticDropdown({
        displayName: 'Form',
        required: true,
        options: {
          options,
        },
      });
      return fields;
    }

    if (required_parameter === 'sequence_id') {
      const courses = await fetchSequences(auth.secret_text);
      const options = courses.map((sequence) => {
        return {
          label: sequence.name,
          value: sequence.id,
        };
      });
      fields[required_parameter] = Property.StaticDropdown({
        displayName: 'Sequence',
        required: true,
        options: {
          options,
        },
      });
      return fields;
    }

    const field = {
      displayName: param_label,
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
    label: 'Subscriber Activated',
    value: EventType.subscriberActivate,
    required_parameter: null,
    param_label: null,
    type: null,
  },
  {
    label: 'Subscriber Unsubscribed',
    value: EventType.subscriberUnsubscribe,
    required_parameter: null,
    param_label: null,
    type: null,
  },
  {
    label: 'Subscriber Bounced',
    value: EventType.subscriberBounce,
    required_parameter: null,
    param_label: null,
    type: null,
  },
  {
    label: 'Subscriber Complained',
    value: EventType.subscriberComplain,
    required_parameter: null,
    param_label: null,
    type: null,
  },
  {
    label: 'Form Subscribed',
    value: EventType.formSubscribe,
    required_parameter: 'form_id',
    param_label: 'Form ID',
    type: 'number',
  },
  {
    label: 'Sequence Subscribed',
    value: EventType.courseSubscribe,
    required_parameter: 'sequence_id',
    param_label: 'Sequence ID',
    type: 'number',
  },
  {
    label: 'Sequence Completed',
    value: EventType.courseComplete,
    required_parameter: 'sequence_id',
    param_label: 'Sequence ID',
    type: 'number',
  },
  {
    label: 'Link Clicked',
    value: EventType.linkClick,
    required_parameter: 'initiator_value',
    param_label: 'Link URL',
    type: 'string',
  },
  {
    label: 'Product Purchased',
    value: EventType.productPurchase,
    required_parameter: 'product_id',
    param_label: 'Product ID',
    type: 'number',
  },
  {
    label: 'Tag Added To Subscriber',
    value: EventType.tagAdd,
    required_parameter: 'tag_id',
    param_label: 'Tag ID',
    type: 'number',
  },
  {
    label: 'Tag Removed From Subscriber',
    value: EventType.tagRemove,
    required_parameter: 'tag_id',
    param_label: 'Tag ID',
    type: 'number',
  },
  {
    label: 'Purchase Created',
    value: EventType.purchaseCreate,
    required_parameter: null,
    param_label: null,
    type: null,
  },
];

export const event = Property.StaticDropdown({
  displayName: 'Event',
  description: 'The Kit event that sends the webhook.',
  required: true,
  options: {
    options: createWebhookParameterOptions,
  },
});
