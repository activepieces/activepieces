import { createTrigger, httpClient, HttpRequest, HttpMethod, Property } from '@activepieces/framework'
import { TriggerStrategy } from '@activepieces/shared'

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
    authentication: Property.SecretText({
      displayName: 'Secret API Key',
      description: `
        To access your **Secret API Key**
        ---
        1. Log in to ActiveCampaign
        2. Go to Settings, then Developer. https://your_account_name_here.activehosted.com/app/settings/developer
        3. Under \`API Access\` copy \`Key\` and Paste it below.
        4. Click **Save**
      `,
      required: true
    }),
    account_name: Property.ShortText({
      displayName: "Account Name",
      description: "Your username/account name. Please check for possible typos.",
      required: true
    })
  },
  sampleData,
  type: TriggerStrategy.WEBHOOK,
  async onEnable({ webhookUrl, store, propsValue }) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://${propsValue.account_name}.api-us1.com/api/3/webhooks`,
      body: {
        webhook: {
          "name": `Webhook: ${event}`,
          "url": webhookUrl.replace("http://localhost:3000", "https://6aa8-212-49-88-96.eu.ngrok.io"),
          "events": [event],
          "sources": ['api', 'public', 'admin', 'system']
        }
      },
      headers: {
        'Api-Token': propsValue.authentication
      }
    };
    const response = await httpClient.sendRequest<WebhookInformation>(request);
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