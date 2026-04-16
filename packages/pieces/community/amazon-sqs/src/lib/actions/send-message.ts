import { amazonSqsAuth, createSqs } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';

export const sendMessage = createAction({
  name: 'sendMessage',
  displayName: 'Send Message',
  auth: amazonSqsAuth,
  description: '',
  props: {
    queueUrl: Property.ShortText({
      displayName: 'Queue URL',
      description: 'The URL of the SQS queue',
      required: true,
    }),
    messageBody: Property.ShortText({
      displayName: 'Message Body',
      description: 'The body of the message',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const sqs = await createSqs(auth.props);
    const { queueUrl, messageBody } = propsValue;

    return sqs.sendMessage({ QueueUrl: queueUrl, MessageBody: messageBody });
  },
});
