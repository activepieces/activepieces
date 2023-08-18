import { Property, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from "@activepieces/pieces-framework";

import { googlePubsubAuth } from '../..';
import { IAuth, common } from '../common';

export const newMessageInTopic = createTrigger({
  auth: googlePubsubAuth,
  name: 'new_message_in_topic',
  displayName: 'New Message',
  description: 'Trigger when a new message is sended.',
  props: {
    subscription: Property.ShortText({
      displayName: 'Subscription name',
      required: true,
    }),
    topic: Property.Dropdown({
      displayName: 'Topic',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        return common.getTopics(auth as IAuth);
      },
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  onEnable: async (context) => {
    const client = common.getClient(context.auth);

    const { topic, subscription } = context.propsValue;
    const project = context.auth.projectId;

    const url = `https://pubsub.googleapis.com/v1/projects/${project}/subscriptions/${subscription}`;
    const body = {
      topic,
      pushConfig: {
        pushEndpoint: context.webhookUrl,
        attributes: {},
      },
      ackDeadlineSeconds: 100,
    };

    await client.request({
      url,
      method: 'PUT',
      data: JSON.stringify(body),
    });

    await context.store.put<ISubscriptionInfo>('_trigger', {
      project,
      subscription,
    });
  },
  onDisable: async (context) => {
    const response = await context.store.get<ISubscriptionInfo>('_trigger');

    if (response !== null && response !== undefined) {
      const client = common.getClient(context.auth);
      const { project, subscription } = response;
      const url = `https://pubsub.googleapis.com/v1/projects/${project}/subscriptions/${subscription}`;

      await client.request({
        url,
        method: 'DELETE',
      });
    }
  },
  async run(context) {
    console.debug("payload received", context.payload.body);
    const { data } = context.payload.body.message;
    const object = data ? JSON.parse(Buffer.from(data, 'base64').toString()) : {};

    return [object];
  },
  sampleData: {
    x: 1.0,
    y: -1.0,
    text: "Just text sample",
  }
});

interface ISubscriptionInfo {
  project: string;
  subscription: string;
}
