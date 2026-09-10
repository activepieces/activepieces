import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sentAuth } from '../auth';
import { sentApi } from '../common/api';
import { sentMessage } from '../common/message';
import { sentProps } from '../common/props';
import { sentValues } from '../common/values';

export const sendMessage = createAction({
  auth: sentAuth,
  name: 'send_message',
  classification: 'WRITE',
  displayName: 'Send Message',
  description:
    'Send text or a template through SMS, WhatsApp, or RCS. Acceptance is asynchronous; use the returned message IDs to track delivery.',
  audience: 'both',
  aiMetadata: {
    description:
      'Send one message per recipient/channel pair. Multiple channels broadcast separate messages. Sandbox validates without sending. Retrying can duplicate messages unless the same explicit idempotency key is reused within 24 hours.',
    idempotent: false,
  },
  props: {
    profile_id: sentProps.profile,
    to: Property.Array({
      displayName: 'Recipients',
      description:
        'One E.164 phone number per item, including the country code, for example +12025550123.',
      required: true,
    }),
    channel: Property.StaticMultiSelectDropdown({
      displayName: 'Channels',
      description:
        'Auto-detect lets Sent choose. Selecting multiple channels sends a separate message on each channel; this is broadcast, not a fallback order.',
      required: false,
      defaultValue: ['sent'],
      options: {
        options: [
          { label: 'Auto-detect', value: 'sent' },
          { label: 'SMS', value: 'sms' },
          { label: 'WhatsApp', value: 'whatsapp' },
          { label: 'RCS', value: 'rcs' },
        ],
      },
    }),
    message_type: Property.StaticDropdown({
      displayName: 'Message Type',
      required: true,
      defaultValue: 'text',
      options: {
        options: [
          { label: 'Text', value: 'text' },
          { label: 'Template', value: 'template' },
        ],
      },
    }),
    content: sentProps.content,
    sandbox: Property.Checkbox({
      displayName: 'Sandbox',
      description:
        'Validate the request and return simulated data without sending a real message.',
      required: false,
      defaultValue: false,
    }),
    idempotency_key: Property.ShortText({
      displayName: 'Idempotency Key',
      description:
        'Optional unique operation key, 1–255 letters, digits, hyphens, or underscores. Reuse for retries within 24 hours; use a different key for each intentional send, including each loop item.',
      required: false,
    }),
  },
  run: async ({ auth, propsValue }) =>
    sentApi.request({
      apiKey: auth.secret_text,
      path: '/messages',
      method: HttpMethod.POST,
      profileId: propsValue.profile_id,
      idempotencyKey: sentValues.optionalString(propsValue.idempotency_key),
      body: sentMessage.build({
        recipients: propsValue.to,
        channels: propsValue.channel,
        messageType: propsValue.message_type,
        content: propsValue.content,
        sandbox: propsValue.sandbox,
      }),
    }),
});
