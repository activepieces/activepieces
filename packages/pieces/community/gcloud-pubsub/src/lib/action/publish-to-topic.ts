import { createAction, Property } from '@activepieces/pieces-framework';
import { common } from '../common';
import { googlePubsubAuth } from '../..';

export const publishToTopic = createAction({
  name: 'publish_to_topic',
  auth: googlePubsubAuth,
  displayName: 'Publish to topic',
  description: 'Publish message to topic',
  props: {
    message: Property.Object({
      displayName: 'Message',
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
  },
  async run(context) {
    const client = common.getClient(context.auth.json);
    const topic = context.propsValue.topic;

    const url = `https://pubsub.googleapis.com/v1/${topic}:publish`;
    const json = JSON.stringify(context.propsValue.message);
    const body = JSON.stringify({
      messages: [{ data: Buffer.from(json).toString('base64') }],
    });

    const { data } = await client.request<{ messageIds: string[] }>({
      url,
      method: 'POST',
      body,
    });

    console.debug(
      `Message sended to topic[${topic}]: ${json}, ack: ${data.messageIds[0]}`
    );
    return json;
  },
});
