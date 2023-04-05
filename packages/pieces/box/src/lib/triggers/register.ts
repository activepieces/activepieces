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

export const boxRegisterTrigger = ({ name, event, displayName, description, sampleData }: Props) => createTrigger({
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
      scope: [
        'manage_webhook',
        'root_readonly',
        'root_readwrite'
      ]
    }),
    id: Property.ShortText({
      displayName: 'Item ID',
      description: 'The ID of the item to trigger a webhook',
      required: true
    }),
    type: Property.StaticDropdown({
      displayName: 'Item Type',
      description: 'The type of the item to trigger a webhook',
      required: true,
      options: {
        options: [
          { label: "File", value: "file" },
          { label: "Folder", value: "folder" }
        ]
      }
    })
  },
  sampleData: sampleData,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const target: Record<string, unknown> = {
      id: context.propsValue.id,
      type: context.propsValue.type
    }
    const authentication: OAuth2PropertyValue = context.propsValue['authentication']
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.box.com/2.0/webhooks`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authentication.access_token,
      },
      body: {
        address: context.webhookUrl,
        triggers: [event],
        target: target
      }
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

    //TODO: Verify; https://developer.box.com/guides/webhooks/v2/signatures-v2/
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