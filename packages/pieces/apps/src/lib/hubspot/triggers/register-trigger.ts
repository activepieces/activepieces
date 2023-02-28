import { createTrigger, Property, TriggerStrategy } from "@activepieces/framework"

interface Props {
  name: string,
  eventType: string,
  displayName: string,
  description: string,
  sampleData: object
}

export const hubspotRegisterTrigger = 
  ({ name, eventType, displayName, description, sampleData}: Props) => 
    createTrigger({
      name: name,
      displayName,
      description,
      props: {
        is_active: Property.Checkbox({
          displayName: 'Folder name',
          description: 'The name of the new folder',
          required: true,
        }),
        propery_name: Property.DynamicProperties({
          
        })
      },
      sampleData,
      type: TriggerStrategy.WEBHOOK,
      async onEnable(context) {
        const request: HttpRequest = {
          method: HttpMethod.POST,
          url: `https://api.hubapi.com/webhooks/v3/${appId}/subscriptions`,
          body: {
            active: true,
            eventType,
          },
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: context.propsValue['authentication']['access_token'],
          },
          queryParams: {},
        };
        const { body: webhook } = await httpClient.sendRequest<{ id: string }>(request);
        await context.store.put<WebhookInformation>(`github_${name}_trigger`, {
          webhookId: webhook.id,
          owner: owner,
          repo: repo,
        });
      },
      async onDisable(context) {
      },
      async run(context) {
        console.debug("payload received", context.payload.body)

        return [context.payload.body];
      }
    })