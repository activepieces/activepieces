import { Property, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';

import { googlePubsubAuth } from '../..';
import { common } from '../common';

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
        const json = (auth as { json: string }).json;
        return common.getTopics(json);
      },
    }),
    ackDeadlineSeconds: Property.Number({
      displayName: 'Ack Deadline Seconds',
      required: true,
      defaultValue: 100,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  onEnable: async (context) => {
    const json = (context.auth as { json: string }).json;
    const client = common.getClient(json);

    const { topic, subscription } = context.propsValue;
    const project = common.getProjectId(context.auth.json as string);

    const url = `https://pubsub.googleapis.com/v1/projects/${project}/subscriptions/${subscription}`;
    const body = {
      topic,
      pushConfig: {
        pushEndpoint: context.webhookUrl,
        attributes: {},
      },
      ackDeadlineSeconds: context.propsValue.ackDeadlineSeconds,
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
      const json = (context.auth as { json: string }).json;
      const client = common.getClient(json);
      const { project, subscription } = response;
      const url = `https://pubsub.googleapis.com/v1/projects/${project}/subscriptions/${subscription}`;

      await client.request({
        url,
        method: 'DELETE',
      });
    }
  },
  async run(context) {
    console.debug('payload received', context.payload.body);
    const payloadBody = context.payload.body as PayloadBody;
    const { data } = payloadBody.message;
    const object = data
      ? JSON.parse(Buffer.from(data, 'base64').toString())
      : {};

    return [object];
  },
  sampleData: {
    x: 1.0,
    y: -1.0,
    text: 'Just text sample',
  },
});

interface ISubscriptionInfo {
  project: string;
  subscription: string;
}

type PayloadBody = {
  message: {
    data: string;
  };
};
