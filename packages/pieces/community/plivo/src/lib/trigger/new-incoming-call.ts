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

const markdown = `## Plivo Incoming Call

Fires the moment a call reaches the selected number, before it is answered, so the flow
decides what happens next. While the flow is enabled that number is pointed at this flow
automatically and it is returned to the application it used before on disable.

Add the **Answer Call** action as the last step. Plivo waits for the XML that action returns
and plays it to the caller. Without it the caller hears nothing and the call ends.

Only an action from this piece can answer the call, because Activepieces sends a synchronous
webhook response solely when the responding action belongs to the same piece as the trigger.
A generic Return Response step leaves the call unanswered.

Loading sample data captures the call details but cannot answer the caller, because the
test webhook has no synchronous form.

To wire it up by hand instead, leave the number empty and set the Answer URL on the Plivo
application to the address below with method POST.
\`\`\`text
{{webhookUrl}}/sync
\`\`\`
`;

const MANAGED_APP_STORE_KEY = '_plivo_new_incoming_call_app';
const ANSWER_URL_STORE_KEY = '_plivo_new_incoming_call_url';

// Plivo waits for XML on the synchronous webhook, which is the plain path plus /sync.
// The test webhook has no synchronous form, so a simulation registers the path as given
// and captures the call details without answering.
const answerUrlFor = (webhookUrl: string): string => {
  const trimmed = webhookUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/test') ? trimmed : `${trimmed}/sync`;
};

export const plivoNewIncomingCall = createTrigger({
  auth: plivoAuth,
  name: 'new_incoming_call',
  displayName: 'New Incoming Call',
  description: 'Triggers when a call comes in, before it is answered',
  aiMetadata: {
    description:
      'Fires when an inbound voice call reaches a Plivo number whose application Answer URL points at this webhook. The call is still ringing, so the flow can answer it with the Answer Call action from this same piece, which returns Plivo XML to the caller. Each event carries the caller, the dialled number, the call UUID, and the call direction.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    phone_number: plivoCommon.trigger_voice_phone_number,
    markdown: Property.MarkDown({
      value: markdown,
    }),
  },
  sampleData: {
    From: '+14151234567',
    To: '+14157654321',
    CallUUID: '5607532d-5037-4066-befc-a8b40218dd4f',
    Direction: 'inbound',
    CallStatus: 'ringing',
    Event: 'StartApp',
  },
  async onEnable(context) {
    const answerUrl = answerUrlFor(context.webhookUrl);
    // Activepieces passes no webhook URL to the run hook on its synchronous route, which
    // is the route a voice answer URL has to use, so the URL Plivo will sign is recorded
    // here while it is still known. Recorded for the manual setup too, because signature
    // verification needs the exact URL either way.
    await context.store.put<string>(ANSWER_URL_STORE_KEY, answerUrl);

    const number = context.propsValue.phone_number;
    if (!number) {
      return;
    }
    const managed = await provisionWebhook({
      auth: context.auth,
      number,
      webhookUrl: answerUrl,
      kind: 'answer',
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
    try {
      await releaseWebhook({ auth: context.auth, managed });
    } finally {
      await context.store.delete(MANAGED_APP_STORE_KEY);
      await context.store.delete(ANSWER_URL_STORE_KEY);
    }
  },
  async run(context) {
    const params = context.payload.body;
    const registeredUrl = await context.store.get<string>(ANSWER_URL_STORE_KEY);
    const urlCandidates = registeredUrl
      ? [registeredUrl]
      : webhookUrlCandidates(context.webhookUrl);

    // The synchronous route runs the flow from this hook's return value without checking
    // whether it produced an event, so returning nothing would let an unsigned request
    // reach the rest of the flow. Refusing loudly is what keeps the check meaningful.
    if (
      !isRecord(params) ||
      !isFromPlivo({
        urlCandidates,
        signedParams: paramsForSigning(
          context.payload.rawBody,
          context.payload.headers,
          params
        ),
        headers: context.payload.headers,
        authToken: context.auth.password,
        channel: 'voice',
      })
    ) {
      throw new Error(
        'Refused a request to this flow because it does not carry a valid Plivo signature.'
      );
    }

    if (typeof params['CallUUID'] !== 'string') {
      throw new Error(
        'Refused a request to this flow because it does not describe a Plivo call.'
      );
    }

    return [params];
  },
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
