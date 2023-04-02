import { createTrigger, httpClient, HttpRequest, HttpMethod, Property, AuthenticationType, OAuth2PropertyValue } from '@activepieces/framework'
import { TriggerStrategy } from '@activepieces/shared'

interface Props {
  name: string,
  event: string,
  displayName: string,
  description: string,
  sampleData: object,
  props?: object
}

export const clickFunnelsRegisterTrigger = ({ name, event, displayName, description, sampleData }: Props) => createTrigger({
  name: `clickfunnels_trigger_${name}`,
  displayName: displayName,
  description: description,
  props: {
    authentication: Property.OAuth2({
      displayName: 'Developer Token',
      description: 'Your Developer Token',
      required: true,
      authUrl: 'https://api.clickfunnels.com/oauth/authorize',
      tokenUrl: 'https://api.clickfunnels.com/oauth/token',
      scope: ['public']
    }),
    funnel_id: Property.ShortText({
      displayName: 'Funnel Id',
      description: 'Specific funnel Id',
      required: true,
    }),
    funnel_step_id: Property.ShortText({
      displayName: 'Funnel Step Id',
      description: 'Specific funnel step Id',
      required: false,
    }),
  },
  sampleData: sampleData,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const authentication: OAuth2PropertyValue = context.propsValue['authentication']

    const funnel_webhook: Record<string, unknown> = {
      url: context.webhookUrl,
      event: event,
      funnel_id: context.propsValue.funnel_id
    }
    
    if (context.propsValue.funnel_step_id) {
      funnel_webhook['funnel_step_id'] = context.propsValue.funnel_step_id
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.clickfunnels.com/api/attributes/funnel_webhooks.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authentication.access_token,
      },
      body: {
        funnel_webhook
      }
    }

    const { body: webhook } = await httpClient.sendRequest<WebhookInformation>(request);
    await context.store.put<WebhookInformation>(`clickfunnels_${name}_trigger`, webhook);
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(`clickfunnels_${name}_trigger`);
    const authentication: OAuth2PropertyValue = context.propsValue['authentication']

    if (webhook) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `https://api.clickfunnels.com/api/attributes/funnel_webhooks/${webhook.id}.json`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: authentication.access_token,
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
  id: string
  target: string
  type: string
  address: string
  created_at: string
  created_by: string
  triggers: string[]
}