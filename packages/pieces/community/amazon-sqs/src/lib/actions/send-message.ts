import { amazonSqsAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { SQS } from '@aws-sdk/client-sqs';

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
    const sqs = new SQS({
      credentials: {
        accessKeyId: auth.accessKeyId,
        secretAccessKey: auth.secretAccessKey,
      },
      region: auth.region,
    });
    const { queueUrl, messageBody } = propsValue;

    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
    };
    return sqs.sendMessage(params);
  },
});
