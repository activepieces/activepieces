import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { getAuth } from '../common';

export const sendToDatabin = createAction({
  auth: ninjapipeAuth,
  name: 'send_to_databin',
  displayName: 'Send to Databin',
  description: 'Sends a JSON payload to a Databin webhook URL on your connected NinjaPipe workspace.',
  props: {
    webhookUrl: Property.ShortText({
      displayName: 'Databin Webhook URL',
      description: 'The full HTTPS webhook URL from your Databin. Must point to your connected NinjaPipe host and contain /api/webhooks/.',
      required: true,
    }),
    payload: Property.Json({
      displayName: 'Payload',
      description: 'JSON object to send.',
      required: true,
    }),
  },
  async run(context) {
    const auth = getAuth(context);
    const rawUrl = String(context.propsValue.webhookUrl ?? '').trim();
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new Error('Invalid webhook URL: not a valid URL.');
    }
    if (parsed.protocol !== 'https:') {
      throw new Error('Invalid webhook URL: must use https://.');
    }
    if (!parsed.pathname.includes('/api/webhooks/')) {
      throw new Error('Invalid webhook URL: path must contain /api/webhooks/.');
    }
    const expectedHost = (() => {
      try {
        return new URL(auth.base_url).host.toLowerCase();
      } catch {
        return '';
      }
    })();
    const actualHost = parsed.host.toLowerCase();
    const isHostAllowed =
      expectedHost === actualHost ||
      (expectedHost && actualHost.endsWith('.' + expectedHost.replace(/^www\./, ''))) ||
      (expectedHost && expectedHost.endsWith('.' + actualHost.replace(/^www\./, ''))) ||
      actualHost === expectedHost.replace(/^www\./, '') ||
      actualHost.replace(/^www\./, '') === expectedHost.replace(/^www\./, '');
    if (!isHostAllowed) {
      throw new Error(
        `Webhook host "${actualHost}" does not match your connected NinjaPipe host "${expectedHost}". Update the connection or use a Databin URL from your workspace.`,
      );
    }
    const body =
      typeof context.propsValue.payload === 'string'
        ? JSON.parse(context.propsValue.payload)
        : context.propsValue.payload;
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.POST,
      url: rawUrl,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
    });
    return response.body;
  },
});
