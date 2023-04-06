import { createTrigger, httpClient, HttpMethod } from '@activepieces/framework'
import { TriggerStrategy } from '@activepieces/shared'
import { activeCampaignProps } from '../common';

interface Props {
  event: string,
  displayName: string,
  description: string,
  sampleData: object,
  props?: object
}

export const activeCampaignRegisterTrigger = ({ event, displayName, description, sampleData }: Props) => createTrigger({
  name: `activecampaign_trigger_${event}`,
  displayName,
  description,
  props: {
    ...activeCampaignProps
  },
  sampleData,
  type: TriggerStrategy.WEBHOOK,
  async onEnable({ webhookUrl, store, propsValue }) {
    const response = await httpClient.sendRequest<WebhookInformation>({
      method: HttpMethod.POST,
      url: `https://${propsValue.account_name}.api-us1.com/api/3/webhooks`,
      body: {
        webhook: {
          name: `Webhook: ${event}`,
          url: webhookUrl.replace("http://localhost:3000", "https://6aa8-212-49-88-96.eu.ngrok.io"),
          events: [event],
          sources: ['api', 'public', 'admin', 'system']
        }
      },
      headers: {
        'Api-Token': propsValue.authentication
      }
    });
    await store.put<WebhookInformation>(`activecampaign_${event}_trigger`, response.body);
  },
  async onDisable({ store, propsValue }) {
    const response = await store.get<WebhookInformation>(`activecampaign_${event}_trigger`);
    if (response != null) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.activecampaign.com/v3/automations/hooks/${response.webhook.id}`,
        headers: {
          'Api-Token': propsValue.authentication
        }
      });
    }
  },
  async run(context) {
    console.debug("payload received", context.payload.body)
    return [context.payload.body];
  }
})

interface WebhookInformation {
  webhook: {
    id: string
    cdate: string
    listid: string
    name: string
    url: string
    events: string[]
    sources: string[]
    links: string[]
  }
}