import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { dripCommon } from '../common';
import { dripAuth } from '../../';

const triggerNameInStore = 'drip_new_subscriber_trigger';
export const dripNewSubscriberEvent = createTrigger({
  auth: dripAuth,
  name: 'new_subscriber',
  displayName: 'New Subscriber',
  description: 'Triggers when a subscriber is created in your Drip account.',
  props: {
    account_id: dripCommon.account_id,
  },
  sampleData: {
    event: 'subscriber.created',
    data: {
      account_id: '9999999',
      subscriber: {},
    },
    occurred_at: '2013-06-21T10:31:58Z',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable({ auth, propsValue, webhookUrl, store }) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${dripCommon.baseUrl(propsValue.account_id)}/webhooks`,
      body: {
        webhooks: [{ post_url: webhookUrl, events: ['subscriber.created'] }],
      },
      headers: {
        Authorization: dripCommon.authorizationHeader(auth),
      },
      queryParams: {},
    };
    const { body } = await httpClient.sendRequest<{
      webhooks: { id: string }[];
    }>(request);
    await store.put<DripWebhookInformation>(triggerNameInStore, {
      webhookId: body.webhooks[0].id,
      userId: propsValue.account_id,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<DripWebhookInformation>(
      triggerNameInStore
    );
    if (response !== null && response !== undefined) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${dripCommon.baseUrl(response.userId)}/webhooks/${
          response.webhookId
        }`,
        headers: {
          Authorization: dripCommon.authorizationHeader(context.auth),
        },
      };
      await httpClient.sendRequest(request);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});

interface DripWebhookInformation {
  webhookId: string;
  userId: string;
}
