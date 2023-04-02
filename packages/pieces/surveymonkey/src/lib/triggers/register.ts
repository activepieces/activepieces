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

export const surveyMonkeyRegisterTrigger = ({ name, event, displayName, description, sampleData, props }: Props) => createTrigger({
  name: `surveymonkey_trigger_${name}`,
  displayName: displayName,
  description: description,
  props: {
    authentication: Property.SecretText({
      displayName: 'Private Token',
      description: 'Your Private Token',
      required: true
    }),
    ...(props ?? {})
  },
  sampleData: sampleData,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const body: Record<string, unknown> = {
      name,
      event_type: event,
      subscription_url: context.webhookUrl
    }

    if ('object_type' in context.propsValue)
      body['object_type'] = context.propsValue.object_type

    if ('object_ids' in context.propsValue)
      body['object_ids'] = context.propsValue.object_ids

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.surveymonkey.com/v3/webhooks/`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.propsValue.authentication
      },
      body
    }

    const { body: webhook } = await httpClient.sendRequest<WebhookInformation>(request);
    await context.store.put<WebhookInformation>(`surveymonkey_${name}_trigger`, webhook);
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(`surveymonkey_${name}_trigger`);

    if (webhook) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `https://api.surveymonkey.com/v3/webhooks/${webhook.id}`,
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
  name: string
  event_type: string
  object_type: string
  object_ids: string[]
  subscription_url: string
  href: string
}