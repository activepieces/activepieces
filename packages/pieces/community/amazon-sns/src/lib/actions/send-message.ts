import { createAction, Property } from '@activepieces/pieces-framework';
import { createSNS } from '../common';
import { amazonSnsAuth } from '../..';
import { ListTopicsCommand, PublishCommand } from "@aws-sdk/client-sns";

export const sendMessageAction = createAction({
  auth: amazonSnsAuth,
  name: 'send-message',
  displayName: 'Send Message',
  description: 'Sends a message to an Amazon SNS topic.',
  props: {
    topic: Property.Dropdown({
        displayName: 'Topic',
        description: 'Select a topic',
        required: true,
        refreshers: ['auth'],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first',
                };
            }
            const sns = await createSNS((auth as { accessKeyId: string, secretAccessKey: string, region: string, endpoint: string }));
            const topics = await sns.send(new ListTopicsCommand({}));
            if (topics.Topics) {
                return {
                    options: topics.Topics.map((topic) =>(
                        {
                            label: topic.TopicArn?.split(':').pop() as string,
                            value: topic.TopicArn as string,
                        }
                    )),
                };
            } else {
                return {
                    options: [],
                    placeholder: 'No topics found',
                };
            }
        },
    }),
    message: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
  },
  async run(context) {
      const { topic, message } = context.propsValue;
      const sns = createSNS(context.auth);
      const response = await sns.send(new PublishCommand({ TopicArn: topic, Message: message }));

      return response;
  },
});
