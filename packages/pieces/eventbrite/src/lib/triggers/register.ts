import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework"
import { httpClient, HttpRequest, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { props as eventbriteProps } from "../../common";

interface Props {
  name: string,
  event: string,
  displayName: string,
  description: string,
  props?: object
}

export const eventbriteRegisterTrigger = ({ name, event, displayName, description, props }: Props) => createTrigger({
  name: `eventbrite_trigger_${name}`,
  displayName: displayName,
  description: description,
  props: {
    authentication: eventbriteProps.authentication,
    organization_id: eventbriteProps.organization_id,
    ...props
  },
  sampleData: {
    api_url: 'https://www.eventbriteapi.com/{api-endpoint-to-fetch-object-details}/',
    config: {
      webhook_id: '11370521',
      user_id: '1487484873013',
      action: 'test',
      endpoint_url: 'https://4e63-102-167-31-143.ngrok-free.app/v1/webhooks/EJffn0ILoGFPzTVLLhkHr'
    }
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable({ propsValue, webhookUrl, store }) {
    const { authentication, organization_id, ...event_props } = propsValue
    const response = await httpClient.sendRequest<WebhookInformation>({
      method: HttpMethod.POST,
      url: `https://www.eventbriteapi.com/v3/organizations/${organization_id}/webhooks/`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authentication.access_token
      },
      body: {
        actions: event,
        endpoint_url: webhookUrl,
        ...event_props
      }
    });
    await store.put<WebhookInformation>(`eventbrite_${name}_trigger`, response.body);
  },
  async onDisable({ propsValue, store }) {
    const webhook = await store.get<WebhookInformation>(`eventbrite_${name}_trigger`);

    if (webhook) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `https://www.eventbriteapi.com/v3/organizations/${propsValue.organization_id}/webhooks/${webhook.id}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: propsValue.authentication.access_token
        }
      };
      await httpClient.sendRequest(request);
    }
  },
  async run({ payload }) {
    console.debug("payload received", payload.body)
    return [payload.body];
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