import { amazonSqsAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { SQS } from '@aws-sdk/client-sqs';

export const sendMessage = createAction({
  name: 'sendMessage',
  displayName: 'Send Message',
  auth: amazonSqsAuth,
  description: '',
  audience: 'both',
  aiMetadata: { description: 'Sends a single message to an Amazon SQS queue identified by its full queue URL, with the message body as plain text. Use to enqueue work or events for downstream consumers polling the queue. Not idempotent: each call enqueues a separate message, so retrying will produce duplicate messages.', idempotent: false },
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
        accessKeyId: auth.props.accessKeyId,
        secretAccessKey: auth.props.secretAccessKey,
      },
      region: auth.props.region,
    });
    const { queueUrl, messageBody } = propsValue;

    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
    };
    return sqs.sendMessage(params);
  },
});
