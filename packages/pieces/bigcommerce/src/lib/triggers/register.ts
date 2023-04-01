import { createTrigger, httpClient, HttpRequest, HttpMethod, Property } from '@activepieces/framework'
import { TriggerStrategy } from '@activepieces/shared'

interface Props {
  name: string,
  event: string,
  displayName: string,
  description: string,
  sampleData: object,
  props?: object
}

export const bigcommerceRegisterTrigger = ({ name, event, displayName, description, sampleData }: Props) => createTrigger({
  name: `bigcommerce_trigger_${name}`,
  displayName,
  description,
  props: {
    authentication: Property.SecretText({
      displayName: 'Secret API Key',
      description: 'Your API secret key',
      required: true
    }),
    store_hash: Property.ShortText({
      displayName: 'Store Hash',
      description: 'Your Store Hash',
      required: true
    }),
  },
  sampleData,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.bigcommerce.com/stores/${context.propsValue.store_hash}/v3/hooks`,
      body: {
        "scope": event,
        "destination": context.webhookUrl,
        "is_active": true,
        "events_history_enabled": true,
        "headers": {
          "custom": "string"
        }
      }
    };
    const { body: webhook } = await httpClient.sendRequest<WebhookInformation>(request);
    await context.store.put<WebhookInformation>(`bigcommerce_${event}_trigger`, webhook);
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(`bigcommerce_${event}_trigger`);
    if (webhook !== null && webhook !== undefined) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `https://api.bigcommerce.com/stores/${webhook.data.store_hash}/v3/hooks/${webhook.data.id}`,
        headers: {
          'X-Auth-Token': context.propsValue['authentication']
        }
      };
      await httpClient.sendRequest(request);
    }
  },
  async run(context) {
    console.debug("payload received", context.payload.body)
    return [context.payload.body];
  },
});

interface WebhookInformation {
  data: {
    id: number
    client_id: string
    store_hash: string
    created_at: number
    updated_at: number
    scope: string
    destination: string
    is_active: boolean
    headers: {
      custom: string
    }
  }
  meta: {
    pagination: {
      count: number
      current_page: number
      links: {
        current: string
        next: string
        previous: string
      }
      per_page: number
      total: number
      total_pages: number
    }
  }
}