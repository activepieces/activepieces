import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from '../auth';
import {
  createSqsClient, loadSqs,
  normalizeMessage,
  parseOptionalInt,
  resolveQueueUrl,
} from '../common/client';
import { manualQueueUrlProp, queueUrlDropdown } from '../common/props';
import { receiveMessagesOutputSchema } from '../output-schemas';

export const receiveMessages = createAction({
  name: 'receive_messages',
  classification: 'WRITE',
  displayName: 'Receive Messages',
  auth: amazonSqsAuth,
  description:
    'Receives up to 10 messages from a queue. Received messages are hidden from other consumers until the visibility timeout ends; delete them after processing.',
  audience: 'both',
  aiMetadata: {
    description:
      'Receives up to 10 messages from an Amazon SQS queue and returns each with its body, message ID, receipt handle and attributes. Receiving hides the messages from other consumers for the visibility timeout and increments their receive count; it does not delete them, so call Delete Message with the receipt handle once processed. Not idempotent: a second call returns different messages or none.',
    idempotent: false,
  },
  outputSchema: receiveMessagesOutputSchema,
  props: {
    queueUrl: queueUrlDropdown,
    manualQueueUrl: manualQueueUrlProp,
    maxNumberOfMessages: Property.Number({
      displayName: 'Max Number of Messages',
      description: '1-10. Defaults to 1.',
      required: false,
      defaultValue: 1,
    }),
    visibilityTimeout: Property.Number({
      displayName: 'Visibility Timeout (seconds)',
      description: 'Seconds (0-43200) to hide received messages. Empty uses queue default.',
      required: false,
    }),
    waitTimeSeconds: Property.Number({
      displayName: 'Wait Time (seconds)',
      description: 'Long polling wait (0-20) when the queue is empty. Defaults to 0.',
      required: false,
      defaultValue: 0,
    }),
    includeAttributes: Property.Checkbox({
      displayName: 'Include Attributes',
      description: 'Return system attributes and message attributes.',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ propsValue, auth }) {
    const queueUrl = resolveQueueUrl(propsValue);
    const max = parseOptionalInt({ value: propsValue.maxNumberOfMessages, name: 'Max Number of Messages', min: 1, max: 10 }) ?? 1;
    const visibility = parseOptionalInt({ value: propsValue.visibilityTimeout, name: 'Visibility Timeout', min: 0, max: 43200 });
    const wait = parseOptionalInt({ value: propsValue.waitTimeSeconds, name: 'Wait Time', min: 0, max: 20 }) ?? 0;
    const includeAttributes = propsValue.includeAttributes !== false;
    const sqs = await loadSqs();
    const client = await createSqsClient({ auth: auth.props, queueUrl });
    const response = await client.send(
      new sqs.ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: max,
        VisibilityTimeout: visibility,
        WaitTimeSeconds: wait,
        MessageSystemAttributeNames: includeAttributes ? ['All'] : undefined,
        MessageAttributeNames: includeAttributes ? ['All'] : undefined,
      })
    );
    const messages = (response.Messages ?? []).map(normalizeMessage);
    return { messages, count: messages.length };
  },
});
