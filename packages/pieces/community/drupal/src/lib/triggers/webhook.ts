import {
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  createTrigger,
  PiecePropValueSchema,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { drupalAuth } from '../../';
type DrupalAuthType = PiecePropValueSchema<typeof drupalAuth>;

export const drupalWebhook = createTrigger({
  auth: drupalAuth,
  name: 'drupalWebhook',
  displayName: 'Webhook',
  description: 'A webhook that the Drupal site can call to trigger a flow.',
  props: {
    id: Property.ShortText({
      displayName: 'Name',
      description: 'This name identifies the webhook. It must be unique. It will be used to identify the webhook in the Drupal site, e.g. if you use ECA to call this webhook, you will find this name in the list of available webhooks.',
      required: true,
    }),
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { website_url, username, password } = (context.auth as DrupalAuthType);
    const body: any = {
      id: context.propsValue.id,
      webHookUrl: context.webhookUrl,
    };
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: website_url + `/orchestration/webhook/register`,
      body: body,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Accept': 'application/vnd.api+json',
      },
    });
    console.debug('Webhook register response', response);
    await context.store.put(`_drupal_webhook_trigger_` + context.propsValue.id, response.body);
  },
  async onDisable(context) {
    const { website_url, username, password } = (context.auth as DrupalAuthType);
    const webhook = await context.store.get(`_drupal_webhook_trigger` + context.propsValue.id);
    if (webhook) {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: website_url + `/orchestration/webhook/unregister`,
        body: webhook,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
          'Accept': 'application/vnd.api+json',
        },
      });
      console.debug('Webhook unregister response', response);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
