import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeSchemas } from '../output-schemas';

export const sendToDatabin = createAction({
  auth: ninjapipeAuth,
  name: 'send_to_databin',
  classification: 'WRITE',
  displayName: 'Send to Databin',
  description: 'Sends a JSON payload to a Databin webhook URL of your connected NinjaPipe workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Post a JSON object to a NinjaPipe Databin webhook URL. The URL must be https, contain /api/webhooks/, and use the same host as the connection (a www. prefix may differ); anything else is refused. Each call is a new delivery, so it is not idempotent.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.databin,
  props: {
    webhookUrl: Property.ShortText({
      displayName: 'Databin Webhook URL',
      description: 'The full HTTPS webhook URL from your Databin. Must point to your connected NinjaPipe host and contain /api/webhooks/.',
      required: true,
    }),
    payload: Property.Json({ displayName: 'Payload', description: 'JSON object to send.', required: true }),
  },
  async run(context) {
    const auth = ninjapipeClient.readAuth(context.auth);
    const url = checkWebhookUrl({ rawUrl: String(context.propsValue.webhookUrl ?? '').trim(), baseUrl: auth.baseUrl });
    const payload = parsePayload(context.propsValue.payload);
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: payload,
      });
      return { status: response.status, response: response.body ?? null };
    } catch (error) {
      const failure = ninjapipeClient.isRecord(error) && ninjapipeClient.isRecord(error['response']) ? error['response'] : undefined;
      if (!failure) throw error;
      throw ninjapipeClient.toNinjaPipeError({ status: Number(failure['status']), body: failure['body'], operation: 'send to Databin' });
    }
  },
});

function checkWebhookUrl({ rawUrl, baseUrl }: { rawUrl: string; baseUrl: string }): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid webhook URL: not a valid URL.');
  }
  if (parsed.protocol !== 'https:') throw new Error('Invalid webhook URL: must use https://.');
  if (parsed.username || parsed.password) throw new Error('Invalid webhook URL: must not contain a user name or password.');
  if (!parsed.pathname.includes('/api/webhooks/')) throw new Error('Invalid webhook URL: path must contain /api/webhooks/.');
  const expected = stripWww(new URL(baseUrl).host.toLowerCase());
  const actual = stripWww(parsed.host.toLowerCase());
  if (expected !== actual && !actual.endsWith(`.${expected}`)) {
    throw new Error(`Webhook host "${parsed.host}" does not match your connected NinjaPipe host "${new URL(baseUrl).host}". Use a Databin URL from your workspace.`);
  }
  return parsed.toString();
}

function stripWww(host: string): string {
  return host.startsWith('www.') ? host.slice(4) : host;
}

function parsePayload(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('Payload must be valid JSON.');
  }
}
