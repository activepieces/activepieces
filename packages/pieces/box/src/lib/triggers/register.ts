import { createTrigger, TriggerStrategy, Property, OAuth2PropertyValue, PiecePropertyMap } from '@activepieces/pieces-framework'
import { HttpRequest, HttpMethod, httpClient, AuthenticationType} from '@activepieces/pieces-common'

interface Props {
  name: string,
  event: string,
  displayName: string,
  description: string,
  sampleData: object,
  props?: PiecePropertyMap
}

export const boxRegisterTrigger = ({ name, event, displayName, description, sampleData, props }: Props) => createTrigger({
  name: `box_${name}`,
  displayName: displayName,
  description: description,
  props: {
    authentication: Property.OAuth2({
      displayName: 'Developer Token',
      description: 'Your Developer Token',
      required: true,
      authUrl: 'https://account.box.com/api/oauth2/authorize',
      tokenUrl: 'https://api.box.com/oauth2/token',
      scope: [
        'manage_webhook',
        'root_readonly',
        'root_readwrite'
      ]
    }),
    ...props
  },
  sampleData: sampleData,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { authentication , ...props } = context.propsValue
    const target: Record<string, unknown> = {
      id: (props as Item).id ?? "0",
      type: (props as Item).type ?? "folder"
    } 
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.box.com/2.0/webhooks`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authentication.access_token,
      },
      body: {
        address: context.webhookUrl.replace("http://localhost:3000", "https://4e63-102-167-31-143.ngrok-free.app"),
        triggers: [event],
        target: target
      }
    }

    const { body: webhook } = await httpClient.sendRequest<WebhookInformation>(request);
    await context.store.put(`box_${name}_trigger`, webhook);
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
  async run(ctx) {
    console.debug("payload received", ctx.payload.body)
    return [ctx.payload.body];
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

interface Item {
  id: string
  type?: string
}