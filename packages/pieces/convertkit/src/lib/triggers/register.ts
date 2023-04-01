import { createTrigger, httpClient, HttpRequest, HttpMethod, AuthenticationType, Property } from '@activepieces/framework'
import { TriggerStrategy } from '@activepieces/shared'

interface Props {
  name: string,
  event: string,
  displayName: string,
  description: string,
  sampleData: object,
  props?: object
}

export const convertkitRegisterTrigger = ({ name, event, displayName, description, sampleData, props}: Props) => createTrigger({
  name: `convertkit_trigger_${name}`,
  displayName,
  description,
  props: {
    authentication: Property.SecretText({
      displayName: 'Secret API Key',
      description: 'Your API secret key',
      required: true
    }),
    ...(props ?? {})
  },
  sampleData,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.convertkit.com/v3/automations/hooks`,
      body: {
        event: {name: event},
        target_url: context.webhookUrl,
        api_secret: context.propsValue.authentication as string
      }
    };
    const { body: webhook } = await httpClient.sendRequest<WebhookInformation>(request);
    await context.store.put<WebhookInformation>(`convertkit_${event}_trigger`, webhook);
  },
  async onDisable(context) {
    const response = await context.store.get<WebhookInformation>(`convertkit_${event}_trigger`);
    if (response !== null && response !== undefined) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `https://api.convertkit.com/v3/automations/hooks/${response.rule.id}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.propsValue['authentication'],
        },
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
  rule: {
    id: number,
    account_id: number,
    event: {
      name: string
    }
  }
}