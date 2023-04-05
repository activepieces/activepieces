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

export const eventbriteRegisterTrigger = ({ name, event, displayName, description, sampleData }: Props) => createTrigger({
  name: `eventbrite_trigger_${name}`,
  displayName: displayName,
  description: description,
  props: {
    authentication: Property.OAuth2({
      displayName: 'Authentication',
      description: 'OAuth',
      required: true,
      authUrl: 'https://www.eventbrite.com/oauth/authorize',
      tokenUrl: 'https://www.eventbrite.com/oauth/token',
      scope: []
    }),
    organization_id: Property.Dropdown({
      displayName: 'Organization',
      description: 'The ID of the organization to trigger a webhook',
      required: true,
      refreshers: ['authentication'],
      options: async ({ authentication }) => {
        if (!authentication)
          return {
            disabled: true,
            placeholder: 'connect your account first',
            options: [],
          }

        const response = await httpClient.sendRequest<OrganizationList>({
          method: HttpMethod.GET,
          url: `https://www.eventbriteapi.com/v3/users/me/organizations/`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (authentication as OAuth2PropertyValue).access_token
          }
        })

        return {
          disabled: false,
          options: response.body
            .organizations
            .map((organization) => ({ label: organization.name, value: organization.id })),
        };
      }
    }),
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description: 'The Event ID that triggers this webhook. Leave blank to attach to all events.',
      required: false
    })
  },
  sampleData: sampleData,
  type: TriggerStrategy.WEBHOOK,
  async onEnable({ propsValue, webhookUrl, store }) {
    const response = await httpClient.sendRequest<WebhookInformation>({
      method: HttpMethod.POST,
      url: `https://www.eventbriteapi.com/v3/organizations/${propsValue.organization_id}/webhooks/`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: propsValue.authentication.access_token
      },
      body: {
        actions: event,
        endpoint_url: webhookUrl,
        event_id: propsValue.event_id
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

interface OrganizationList {
  pagination: {
    object_count: number
    page_number: number
    page_size: number
    page_count: number
    continuation: string
    has_more_items: boolean
  },
  organizations: Organization[]
}

interface Organization {
  id: string
  name: string
  vertical: string
  image_id: string
}