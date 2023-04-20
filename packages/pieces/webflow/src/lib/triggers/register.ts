import { createTrigger, OAuth2PropertyValue, TriggerStrategy } from '@activepieces/pieces-framework'
import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

interface Props {
  name: string,
  event: string,
  displayName: string,
  description: string,
  sampleData: object
}

export const webflowRegisterTrigger = ({ name, event, displayName, description, sampleData }: Props) =>
  createTrigger({
    name: `webflow_${name}`,
    displayName: displayName,
    description: description,
    props: {
      authentication: Property.OAuth2({
        displayName: 'Authentication',
        description: 'OAuth Authentication',
        required: true,
        authUrl: 'https://webflow.com/oauth/authorize',
        tokenUrl: 'https://api.webflow.com/oauth/access_token',
        scope: []
      }),
      site_id: Property.Dropdown({
        displayName: 'Site Id',
        description: 'Your Site Id',
        required: true,
        refreshers: ['authentication'],
        options: async ({ authentication }) => {
          if (!authentication) {
            return { disabled: true, placeholder: 'connect your account first', options: [] }
          }

          const { body: sites } = await httpClient.sendRequest<{
            _id: string,
            name: string,
          }[]>({
            method: HttpMethod.GET,
            url: `https://api.webflow.com/sites`,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: (authentication as OAuth2PropertyValue).access_token
            }
          })

          return {
            options: sites.map(
              site => ({
                value: site._id,
                label: site.name
              })
            )
          }
        }
      }),
      form_name: Property.ShortText({
        displayName: 'Form Name',
        description: 'Name of the form to filter webhooks for',
        required: true
      })
    },
    sampleData,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const { body: webhook } = await httpClient.sendRequest<WebhookInformation>({
        method: HttpMethod.POST,
        url: `https://api.webflow.com/sites/${context.propsValue.site_id}/webhooks/`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.propsValue.authentication.access_token
        },
        body: {
          triggerType: event,
          url: context.webhookUrl,
          filter: {
            name: context.propsValue.form_name
          }
        }
      });
      await context.store.put<WebhookInformation>(`webflow_${name}_trigger`, webhook);
    },
    async onDisable({ store, propsValue }) {
      const webhook = await store.get<WebhookInformation>(`webflow_${name}_trigger`);

      if (webhook) {
        await httpClient.sendRequest({
          method: HttpMethod.DELETE,
          url: `https://api.webflow.com/sites/${propsValue.site_id}/webhooks/${webhook._id}`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: propsValue.authentication.access_token
          }
        })
      }
    },
    async run({ payload }) {
      return [payload.body];
    },
  });

interface WebhookInformation {
  _id: string
  triggerType: string
  triggerId: string
  site: string
  createdOn: string
}