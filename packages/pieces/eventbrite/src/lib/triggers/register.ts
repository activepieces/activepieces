import { createTrigger, httpClient, HttpRequest, HttpMethod, Property, AuthenticationType } from '@activepieces/framework'
import { TriggerStrategy } from '@activepieces/shared'

interface Props {
  name: string,
  event: string,
  displayName: string,
  description: string,
  sampleData: object,
  props?: object
}

export const eventbriteRegisterTrigger = ({ name, event, displayName, description, sampleData }: Props) => createTrigger({
  name: `eventbrite_trigger_${name}`,
  displayName: displayName,
  description: description,
  props: {
    authentication: Property.SecretText({
      displayName: 'Private Token',
      description: 'Your Private Token',
      required: true
    }),
    organization_id: Property.ShortText({
      displayName: 'Organization ID',
      description: 'The ID of the organization to trigger a webhook',
      required: true
    }),
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description: 'The Event ID that triggers this webhook. Leave blank for all events.',
      required: false
    })
  },
  sampleData: sampleData,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://www.eventbriteapi.com/v3/webhooks`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.propsValue.authentication
      },
      body: {
        actions: event,
        endpoint_url: context.webhookUrl,
        event_id: context.propsValue.event_id
      }
    }

    const { body: webhook } = await httpClient.sendRequest<WebhookInformation>(request);
    await context.store.put<WebhookInformation>(`eventbrite_${name}_trigger`, webhook);
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(`eventbrite_${name}_trigger`);

    if (webhook) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `https://www.eventbriteapi.com/v3/webhooks/${webhook.id}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.propsValue.authentication
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
  endpoint_url: string
  actions: string[]
  event_id: string
  resource_uri: string
  created: string
  user_id: string
}