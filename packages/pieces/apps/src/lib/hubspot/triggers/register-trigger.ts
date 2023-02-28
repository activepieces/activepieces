import { AuthenticationType, createTrigger, httpClient, HttpMethod, HttpRequest, Property, TriggerStrategy } from "@activepieces/framework"
import { HubspotEventType } from "../common/models"
import { hubSpotAuthentication } from "../common/props"

interface Props {
  name: string,
  eventType: string,
  displayName: string,
  description: string,
  sampleData: object
}

export const hubspotRegisterTrigger = 
  ({ name, eventType, displayName, description, sampleData}: Props) => {
    const props = {
      authentication: hubSpotAuthentication,
      is_active: Property.Checkbox({
        displayName: 'Active',
        description: 'Is this webhook active',
        defaultValue: false,
        required: true,
      }),
      app_id: Property.Checkbox({
        displayName: 'App ID',
        description: 'The name of the new folder',
        required: true,
      }),
      ...((eventType === HubspotEventType.CONTACT_PROPERTY_CHANGE) 
        ? {
          property_name: Property.ShortText({
            displayName: 'Property name',
            description: 'The name of the property the subscription will listen for changes to. This is only needed for property change subscription types.',
            required: true
          }) 
        } 
        : {}
      )
    }

    return createTrigger({
      name,
      displayName,
      description,
      props,
      sampleData,
      type: TriggerStrategy.WEBHOOK,

      async onEnable(context) {
        const { app_id, is_active: active, authentication } = context.propsValue
        
        const request: HttpRequest = {
          method: HttpMethod.POST,
          url: `https://api.hubapi.com/webhooks/v3/${app_id}/subscriptions`,
          body: {
            active,
            eventType,
            propertyName: context.propsValue.property_name
          },
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: authentication.access_token,
          }
        }

        const response = await httpClient.sendRequest(request);
        console.debug("response", response)

        // await context.store.put<WebhookInformation>(`github_${name}_trigger`, {
        //   webhookId: webhook.id,
        //   owner: owner,
        //   repo: repo,
        // });
      },
      async onDisable(context) {
      },
      async run(context) {
        console.debug("payload received", context.payload.body)

        return [context.payload.body];
      }
    })
  }