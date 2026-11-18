import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient } from '../../common/client';
import { createWebhookParameterOptions } from '../../common/webhooks';
import { Webhook } from '../../common/types';
import { kitWebhookOutputSchema } from '../../output-schemas';

const numericParameters = ['form_id', 'sequence_id', 'tag_id', 'product_id'];

export const kitCreateWebhook = createAction({
  auth: convertkitAuth,
  name: 'kit_create_webhook',
  classification: 'WRITE',
  outputSchema: kitWebhookOutputSchema,
  displayName: 'Create Webhook',
  description: 'Register a webhook that Kit calls when an event happens.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Registers a webhook rule that POSTs to a target URL when the chosen event fires. Form, sequence, tag, product and link-click events need their matching parameter (Form ID, Sequence ID, Tag ID, Product ID or Link URL). Each call registers another rule, so check List Webhooks first and keep the returned rule ID for Delete Webhook.',
    idempotent: false,
  },
  props: {
    target_url: Property.ShortText({
      displayName: 'Target URL',
      description: 'The public https:// URL Kit will POST the event payload to.',
      required: true,
    }),
    event: Property.StaticDropdown({
      displayName: 'Event',
      description: 'The event that fires the webhook.',
      required: true,
      options: {
        options: createWebhookParameterOptions.map((option) => ({
          label: option.label,
          value: option.value,
        })),
      },
    }),
    form_id: Property.Number({
      displayName: 'Form ID',
      description: 'Required for the Form subscribed event. Get it from List Forms.',
      required: false,
    }),
    sequence_id: Property.Number({
      displayName: 'Sequence ID',
      description:
        'Required for the Sequence subscribed and Sequence completed events. Get it from List Sequences.',
      required: false,
    }),
    tag_id: Property.Number({
      displayName: 'Tag ID',
      description:
        'Required for the Tag added and Tag removed events. Get it from List Tags.',
      required: false,
    }),
    product_id: Property.Number({
      displayName: 'Product ID',
      description: 'Required for the Product purchased event.',
      required: false,
    }),
    initiator_value: Property.ShortText({
      displayName: 'Link URL',
      description: 'Required for the Link clicked event: the link URL to watch.',
      required: false,
    }),
  },
  async run(context) {
    const { event } = context.propsValue;
    const target_url = context.propsValue.target_url.trim();
    if (!/^https:\/\/[^\s/]+\.[^\s]+$/i.test(target_url)) {
      throw new Error(`Target URL must be a public https:// URL, got "${context.propsValue.target_url}".`);
    }
    const option = createWebhookParameterOptions.find((item) => item.value === event);
    if (!option) {
      throw new Error(`Unknown event "${String(event)}".`);
    }
    const eventBody: Record<string, unknown> = { name: event };
    const parameter = option.required_parameter;
    if (parameter) {
      const propValues: Record<string, unknown> = { ...context.propsValue };
      const raw = propValues[parameter];
      if (raw === undefined || raw === null || raw === '') {
        throw new Error(
          `The "${option.label}" event requires ${option.param_label ?? parameter}.`
        );
      }
      if (numericParameters.includes(parameter)) {
        const id = Number(raw);
        if (!Number.isInteger(id)) {
          throw new Error(`${option.param_label ?? parameter} must be a whole number.`);
        }
        eventBody[parameter] = id;
      } else {
        eventBody[parameter] = String(raw);
      }
    }
    const response = await kitClient.request<{ rule: Webhook }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/automations/hooks',
      body: { target_url, event: eventBody },
    });
    return response.body.rule;
  },
});
