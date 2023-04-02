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

export const boxRegisterTrigger = ({ name, event, displayName, description, sampleData, props }: Props) => createTrigger({
  name: `box_trigger_${name}`,
  displayName: displayName,
  description: description,
  props: {
    authentication: Property.OAuth2({
      displayName: 'Developer Token',
      description: 'Your Developer Token',
      required: true,
      authUrl: 'https://account.box.com/api/oauth2/authorize',
      tokenUrl: 'https://api.box.com/oauth2/token',
      scope: ['manage_webhook']
    }),
    ...(props ?? {})
  },
  sampleData: sampleData,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const target: Record<string, unknown> = {}
    const authentication: OAuth2PropertyValue = context.propsValue['authentication']
    const body: Record<string, unknown> = {
      address: context.webhookUrl,
      triggers: [event]
    }

    if ('id' in context.propsValue && 'type' in context.propsValue) {
      target['id'] = context.propsValue.id
      target['type'] = context.propsValue.type
      body['target'] = target
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.box.com/2.0/webhooks`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authentication.access_token,
      },
      body
    }

    const { body: webhook } = await httpClient.sendRequest<WebhookInformation>(request);
    await context.store.put<WebhookInformation>(`box_${name}_trigger`, webhook);
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(`box_${name}_trigger`);
    const authentication: OAuth2PropertyValue = context.propsValue['authentication']

    if (webhook) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `https://api.box.com/2.0/webhooks/${webhook.id}`,
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