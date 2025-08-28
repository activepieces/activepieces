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
      displayName: 'Webhook ID',
      description: 'The ID of the webhook, make sure this is unique.',
      required: true,
    }),
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { website_url, username, password } = (context.auth as DrupalAuthType);
    // For triggers, we still use modeler_api - this would need an API key from modeler_api setup  
    const api_key = 'placeholder'; // This would come from modeler_api configuration
    const body: any = {
      id: context.propsValue.id,
      webHookUrl: context.webhookUrl,
    };
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: website_url + `/modeler_api/webhook/register`,
      body: body,
      headers: {
        'x-api-key': api_key,
      },
    });
    console.debug('Webhook register response', response);
    await context.store.put(`_drupal_webhook_trigger_` + context.propsValue.id, response.body);
  },
  async onDisable(context) {
    const { website_url, username, password } = (context.auth as DrupalAuthType);
    // For triggers, we still use modeler_api - this would need an API key from modeler_api setup  
    const api_key = 'placeholder'; // This would come from modeler_api configuration
    const webhook = await context.store.get(`_drupal_webhook_trigger` + context.propsValue.id);
    if (webhook) {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: website_url + `/modeler_api/webhook/unregister`,
        body: webhook,
        headers: {
          'x-api-key': api_key,
        },
      });
      console.debug('Webhook unregister response', response);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
