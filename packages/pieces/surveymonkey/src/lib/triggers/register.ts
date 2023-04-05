import { createTrigger, httpClient, HttpRequest, HttpMethod, AuthenticationType, PieceProperty } from '@activepieces/framework'
import { TriggerStrategy } from '@activepieces/shared'

interface Props {
  name: string,
  event: string,
  displayName: string,
  description: string,
  sampleData: object,
  props: PieceProperty
}

export const surveyMonkeyRegisterTrigger = ({ name, event, displayName, description, sampleData, props }: Props) => createTrigger({
  name: `surveymonkey_trigger_${name}`,
  displayName: displayName,
  description: description,
  props,
  sampleData: sampleData,
  type: TriggerStrategy.WEBHOOK,
  async onEnable({ propsValue, webhookUrl, store }) {
    const body: Record<string, unknown> = {
      name: `Webhook ${name}`,
      event_type: event,
      subscription_url: webhookUrl,
      object_ids: propsValue?.['survey_ids'] ?? null,
      object_type: propsValue?.['survey_ids'] ? 'survey' : null,
      authorization: ""
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.surveymonkey.com/v3/webhooks`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (propsValue['authentication'])
      },
      body
    }

    const response = await httpClient.sendRequest<WebhookInformation>(request);
    await store.put<WebhookInformation>(`surveymonkey_${name}_trigger`, response.body);
  },
  async onDisable({ store, propsValue }) {
    const webhook = await store.get<WebhookInformation>(`surveymonkey_${name}_trigger`);

    if (webhook) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `https://api.surveymonkey.com/v3/webhooks/${webhook.id}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: (propsValue['authentication'])
        }
      };
      await httpClient.sendRequest(request)
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