import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { plivoAuth } from '../..';
import {
  PlivoManagedApp,
  plivoCommon,
  provisionWebhook,
  releaseWebhook,
} from '../common';
import {
  isFromPlivo,
  paramsForSigning,
  webhookUrlCandidates,
} from '../common/signature';

const markdown = `## Plivo Incoming SMS

Selecting a phone number is enough. While the flow is enabled that number is pointed at
this flow automatically, and it is returned to the application it used before when the
flow is disabled. A Plivo number can route incoming SMS to one flow at a time.

If that number already delivers SMS somewhere else, that delivery stops while this flow
is enabled and resumes once it is disabled.

To wire it up by hand instead, leave the number empty and set the Message URL below on the
Plivo application, with method POST, then assign the number to that application in the
console at https://cx.plivo.com.
\`\`\`text
{{webhookUrl}}
\`\`\`
`;

const MANAGED_APP_STORE_KEY = '_plivo_new_incoming_sms_app';

export const plivoNewIncomingSms = createTrigger({
  auth: plivoAuth,
  name: 'new_incoming_sms',
  displayName: 'New Incoming SMS',
  description: 'Triggers when a new SMS message is received',
  aiMetadata: {
    description: 'Fires when an inbound SMS message is received on a Plivo number whose application Message URL points at this webhook. Each event represents one incoming text message with its sender, recipient, body, and metadata.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    phone_number: plivoCommon.trigger_phone_number,
    markdown: Property.MarkDown({
      value: markdown,
    }),
  },
  sampleData: {
    From: '+14151234567',
    To: '+14157654321',
    Type: 'sms',
    Text: 'Hello from Plivo!',
    MessageUUID: 'db3ce55a-7f1d-11e1-8ea7-1231380bc196',
    MessageIntent: '',
  },
  async onEnable(context) {
    const number = context.propsValue.phone_number;
    if (!number) {
      return;
    }
    const managed = await provisionWebhook({
      auth: context.auth,
      number,
      webhookUrl: context.webhookUrl,
      kind: 'message',
    });
    await context.store.put<PlivoManagedApp>(MANAGED_APP_STORE_KEY, managed);
  },
  async onDisable(context) {
    const managed = await context.store.get<PlivoManagedApp>(
      MANAGED_APP_STORE_KEY
    );
    if (!managed) {
      return;
    }
    // Drop the stored handle even when Plivo cleanup fails, so a later enable is not
    // blocked by state describing an application this flow no longer manages.
    try {
      await releaseWebhook({ auth: context.auth, managed });
    } finally {
      await context.store.delete(MANAGED_APP_STORE_KEY);
    }
  },
  async run(context) {
    const params = context.payload.body;
    if (!isRecord(params)) {
      return [];
    }

    if (
      !isFromPlivo({
        urlCandidates: webhookUrlCandidates(context.webhookUrl),
        signedParams: paramsForSigning(
          context.payload.rawBody,
          context.payload.headers,
          params
        ),
        headers: context.payload.headers,
        authToken: context.auth.password,
        channel: 'messaging',
      })
    ) {
      return [];
    }

    // A Message URL receives inbound messages and, on some accounts, message status
    // callbacks. A status callback carries Status and is not a new inbound message, so it
    // is ignored. Text is absent on a media only MMS, so its presence is not required or
    // that message would be dropped without trace.
    if (
      typeof params['MessageUUID'] !== 'string' ||
      params['Status'] !== undefined
    ) {
      return [];
    }

    return [params];
  },
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
