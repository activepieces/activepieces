import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../..';

export const activeCampaignTriggers = [
  {
    event: 'subscribe',
    displayName: 'Contact added',
    sampleData: {
      url: '',
      type: '',
      date_time: '',
      initiated_by: '',
      list: '',
      form: {
        id: ''
      },
      contact:{
        id: '',
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        tags: '',
        orgname: '',
        ip: '',
      }
    },
  }
].map(register);

function register({
  event,
  displayName,
  description,
  sampleData,
}: {
  event: string;
  displayName: string;
  description?: string;
  sampleData: object;
  props?: object;
}) {
  return createTrigger({
    name: `activecampaign_trigger_${event}`,
    auth: activeCampaignAuth,
    displayName,
    description: description ?? displayName,
    props: {},
    sampleData,
    type: TriggerStrategy.WEBHOOK,
    async onEnable({ webhookUrl, store, auth }) {
      const response = await httpClient.sendRequest<WebhookInformation>({
        method: HttpMethod.POST,
        url: `https://${auth.account_name}.api-us1.com/api/3/webhooks`,
        body: {
          webhook: {
            name: `Webhook: ${event}`,
            url: webhookUrl,
            events: [event],
            sources: ['api', 'public', 'admin', 'system'],
          },
        },
        headers: {
          'Api-Token': auth.api_key,
        },
      });
      await store.put<WebhookInformation>(
        `${event}_trigger`,
        response.body
      );
    },
    async onDisable({ store, auth }) {
      const response = await store.get<WebhookInformation>(
        `${event}_trigger`
      );
      if (response != null) {
        await httpClient.sendRequest({
          method: HttpMethod.DELETE,
          url: `ttps://${auth.account_name}.api-us1.com/api/3/webhooks/${response.webhook.id}`,
          headers: {
            'Api-Token': auth.api_key,
          },
        });
      }
    },
    async run(context) {
      console.debug('payload received', context.payload.body);
      return [context.payload.body];
    },
  });
}

interface WebhookInformation {
  webhook: {
    id: string;
    cdate: string;
    listid: string;
    name: string;
    url: string;
    events: string[];
    sources: string[];
    links: string[];
  };
}
