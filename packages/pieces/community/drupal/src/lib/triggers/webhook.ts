import {
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  createTrigger,
  MarkdownVariant,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { drupalAuth } from '../auth';

const webhookStoreKey = (id: string) => `_drupal_webhook_trigger_${id}`;

export const drupalWebhook = createTrigger({
  auth: drupalAuth,
  name: 'drupalWebhook',
  classification: 'READ',
  displayName: 'Webhook',
  description: 'Runs when your Drupal site calls this webhook by its name.',
  aiMetadata: {
    description: 'Fires in real time whenever the Drupal site calls the registered webhook URL (e.g. from an ECA action), emitting the request body sent by Drupal. Use for push-based events instead of polling; the webhook is registered on enable under the unique name supplied, which must match the name referenced on the Drupal side.',
  },
  props: {
    requirements: Property.MarkDown({
      value: 'Needs the [Drupal Orchestration](https://www.drupal.org/project/orchestration) module on your site.',
      variant: MarkdownVariant.INFO,
    }),
    id: Property.ShortText({
      displayName: 'Webhook Name',
      description: 'A unique name; ECA on your site lists it among its webhooks.',
      placeholder: 'new_article_webhook',
      required: true,
    }),
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { website_url, username, password } = context.auth.props;
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
    await context.store.put(webhookStoreKey(context.propsValue.id), response.body);
  },
  async onDisable(context) {
    const { website_url, username, password } = context.auth.props;
    const webhook = await context.store.get(webhookStoreKey(context.propsValue.id));
    if (webhook) {
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: website_url + `/orchestration/webhook/unregister`,
        body: webhook,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
          'Accept': 'application/vnd.api+json',
        },
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
