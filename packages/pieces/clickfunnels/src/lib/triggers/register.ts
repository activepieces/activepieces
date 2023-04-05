import { createTrigger, httpClient, HttpRequest, HttpMethod, Property, AuthenticationType, OAuth2PropertyValue, HttpResponse } from '@activepieces/framework'
import { TriggerStrategy } from '@activepieces/shared'

interface Props {
  name: string,
  event: string,
  displayName: string,
  description: string,
  sampleData: object
}

export const clickFunnelsRegisterTrigger = ({ name, event, displayName, description, sampleData }: Props) => createTrigger({
  name: `clickfunnels_trigger_${name}`,
  displayName: displayName,
  description: description,
  props: {
    authentication: Property.OAuth2({
      displayName: 'Developer Token',
      description: 'Your Developer Token',
      required: true,
      authUrl: 'https://api.clickfunnels.com/oauth/authorize',
      tokenUrl: 'https://api.clickfunnels.com/oauth/token',
      scope: ['public']
    }),
    funnel_id: Property.Dropdown({
      displayName: 'Funnel',
      description: 'Choose a funnel',
      required: true,
      refreshers: ['authentication'],
      options: async ({ authentication }) => {
        if (!authentication)
          return { disabled: true, options: [], placeholder: "Please authenticate first" }

        const response = await getFunnels(authentication as OAuth2PropertyValue)

        return {
          disabled: false,
          options: response.body.map((funnel) => ({ "label": funnel.name, "value": funnel.id }))
        }
      }
    }),
    funnel_step_id: Property.Dropdown({
      displayName: 'Funnel Step Id',
      description: 'Specific funnel step Id',
      required: false,
      refreshers: ['authentication', 'funnel_id'],
      options: async ({ authentication, funnel_id }) => {
        if (!authentication)
          return { disabled: true, options: [], placeholder: "Please authenticate first" }
        if (!funnel_id)
          return { disabled: true, options: [], placeholder: "Please select a funnel first" }

        const response = await getFunnelSteps(authentication as OAuth2PropertyValue, funnel_id as string)

        return {
          disabled: false,
          options: response.body.map((funnelstep) => ({ "label": funnelstep.name, "value": funnelstep.id }))
        }
      }
    }),
  },
  sampleData: sampleData,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const authentication: OAuth2PropertyValue = context.propsValue['authentication']

    const funnel_webhook: Record<string, unknown> = {
      url: context.webhookUrl,
      event: event,
      funnel_id: context.propsValue.funnel_id
    }

    if (context.propsValue.funnel_step_id) {
      funnel_webhook['funnel_step_id'] = context.propsValue.funnel_step_id
    }

    const { body: webhook } = await httpClient.sendRequest<WebhookInformation>({
      method: HttpMethod.POST,
      url: `https://api.clickfunnels.com/api/attributes/funnel_webhooks.json`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authentication.access_token,
      },
      body: {
        funnel_webhook
      }
    })
    await context.store.put<WebhookInformation>(`clickfunnels_${name}_trigger`, webhook);
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(`clickfunnels_${name}_trigger`);
    const authentication: OAuth2PropertyValue = context.propsValue['authentication']

    if (webhook) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `https://api.clickfunnels.com/api/attributes/funnel_webhooks/${webhook.id}.json`,
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

const getFunnels = async (authentication: OAuth2PropertyValue) : Promise<HttpResponse<Funnel[]>> => {
  return await httpClient.sendRequest<Funnel[]>({
    method: HttpMethod.GET,
    url: `https://api.clickfunnels.com/api/attributes/funnels.json`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: authentication.access_token,
    }
  })
}

const getFunnelSteps = async (authentication: OAuth2PropertyValue, funnel_id: string) : Promise<HttpResponse<FunnelStep[]>> => {
  return await httpClient.sendRequest<FunnelStep[]>({
    method: HttpMethod.GET,
    url: `https://api.clickfunnels.com/api/attributes/funnels/${funnel_id}/funnel_steps.json`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: authentication.access_token,
    }
  })
}

interface Funnel {
  id: number
  name: string
  created_at: string
  updated_at: string
  group_tag: string
  share_code: string
  key: string
  domain_id: string|number
  path: string
  affiliate_enabled: boolean
  position: number
  purchased_in_marketplace: boolean
  funnel_image_location: string
  funnel_screenshot_location: string
  pages_count: number
  emails_count: number
  funnel_steps: FunnelStep[]
}

interface FunnelStep {
  id: number
  name: string
  funnel_id: number
  created_at: string
  updated_at: string
  position: number
  in_funnel: boolean
  page_category_name: string
  domain_id: string|number
  path: string
  wp_friendly: boolean
  published_url: string
}