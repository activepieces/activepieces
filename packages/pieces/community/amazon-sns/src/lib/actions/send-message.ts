import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { amazonSnsAuth } from '../auth';
import { callSns, createSnsClient } from '../common/client';
import { topicDropdown } from '../common/props';

function optionalText({ value }: { value: string | undefined | null }): string | undefined {
  if (isNil(value)) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function buildMessageAttributes({
  attributes,
}: {
  attributes: unknown;
}): Record<string, { DataType: string; StringValue: string }> | undefined {
  if (isNil(attributes)) {
    return undefined;
  }
  if (typeof attributes === 'string') {
    if (attributes.trim() === '') {
      return undefined;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(attributes);
    } catch {
      throw new Error(
        'Message Attributes is not valid JSON. Enter a JSON object, e.g. {"event_type": "order_placed"}.'
      );
    }
    return buildMessageAttributes({ attributes: parsed });
  }
  if (typeof attributes !== 'object' || attributes === null || Array.isArray(attributes)) {
    throw new Error(
      'Message Attributes must be a JSON object of name to value, e.g. {"event_type": "order_placed"}, not an array or a single value.'
    );
  }
  const entries = Object.entries(attributes);
  if (entries.length === 0) {
    return undefined;
  }
  if (entries.length > 10) {
    throw new Error('Amazon SNS allows at most 10 message attributes per message.');
  }
  const result: Record<string, { DataType: string; StringValue: string }> = {};
  for (const [key, value] of entries) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      result[key] = { DataType: 'Number', StringValue: String(value) };
    } else if (typeof value === 'string') {
      result[key] = { DataType: 'String', StringValue: value };
    } else if (typeof value === 'boolean') {
      result[key] = { DataType: 'String', StringValue: String(value) };
    } else {
      throw new Error(
        `Message attribute "${key}" must be a string, number or boolean value.`
      );
    }
  }
  return result;
}

function validateFifoInput({
  topic,
  messageGroupId,
  deduplicationId,
}: {
  topic: string;
  messageGroupId: string | undefined;
  deduplicationId: string | undefined;
}): void {
  const isFifo = topic.endsWith('.fifo');
  if (isFifo && isNil(messageGroupId)) {
    throw new Error(
      'This is a FIFO topic (its name ends in ".fifo"). Fill in Message Group ID to publish to it.'
    );
  }
  if (!isFifo && !isNil(deduplicationId)) {
    throw new Error(
      'Message Deduplication ID only applies to FIFO topics (names ending in ".fifo"). Clear it for this topic.'
    );
  }
}

export const sendMessageAction = createAction({
  auth: amazonSnsAuth,
  name: 'send-message',
  classification: 'WRITE',
  displayName: 'Send Message',
  description: 'Publishes a message to an Amazon SNS topic, delivered to every subscriber of that topic.',
  audience: 'both',
  aiMetadata: {
    description:
      "Publishes a message to an Amazon SNS topic, fanning it out to all of the topic's subscribers (email, SMS, HTTP/S, SQS, Lambda, etc.). Needs the topic ARN and the message body; use List Topics to find the ARN. For FIFO topics (name ends in .fifo) Message Group ID is required, and Message Deduplication ID is needed unless the topic has content-based deduplication. Not idempotent: each call publishes and delivers a new message, except that on a FIFO topic a repeat with the same deduplication ID within 5 minutes is accepted but not delivered again. To text a single phone number directly, use Send SMS instead.",
    idempotent: false,
  },
  props: {
    topic: topicDropdown({
      displayName: 'Topic',
      description: 'The topic to publish to.',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message body (up to 256 KB).',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Optional subject line used for email subscribers (up to 100 characters).',
      required: false,
    }),
    message_group_id: Property.ShortText({
      displayName: 'Message Group ID',
      description:
        'FIFO topics only (required there). Messages with the same group ID are delivered in order.',
      required: false,
    }),
    message_deduplication_id: Property.ShortText({
      displayName: 'Message Deduplication ID',
      description:
        'FIFO topics only. A repeat publish with the same ID within 5 minutes is accepted but not delivered again. Required unless the topic has content-based deduplication.',
      required: false,
    }),
    message_attributes: Property.Json({
      displayName: 'Message Attributes',
      description:
        'Optional flat JSON object of attribute name to value, used by subscription filter policies, e.g. {"event_type": "order_placed", "priority": 2}. Numbers are sent as Number attributes, everything else as String. At most 10.',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'message_id', label: 'Message ID', description: 'Unique ID SNS assigned to the published message.' },
      {
        key: 'sequence_number',
        label: 'Sequence Number',
        description: 'Sequence number of the message in its group. Only set for FIFO topics; otherwise null.',
      },
      { key: 'topic_arn', label: 'Topic ARN' },
      {
        key: 'MessageId',
        label: 'MessageId (legacy)',
        description: 'Same value as message_id. Kept so existing flows that map MessageId keep working.',
      },
      {
        key: 'SequenceNumber',
        label: 'SequenceNumber (legacy)',
        description: 'Same value as sequence_number. Kept so existing flows that map SequenceNumber keep working.',
      },
    ],
  },
  async run(context) {
    const { message } = context.propsValue;
    const topic = context.propsValue.topic.trim();
    const subject = optionalText({ value: context.propsValue.subject });
    const messageGroupId = optionalText({ value: context.propsValue.message_group_id });
    const deduplicationId = optionalText({ value: context.propsValue.message_deduplication_id });
    if (!isNil(subject) && subject.length > 100) {
      throw new Error('Subject must be 100 characters or fewer.');
    }
    validateFifoInput({ topic, messageGroupId, deduplicationId });
    const messageAttributes = buildMessageAttributes({
      attributes: context.propsValue.message_attributes,
    });
    const { client, sdk } = await createSnsClient({ auth: context.auth.props });
    const response = await callSns({
      operation: 'publish',
      call: () =>
        client.send(
          new sdk.PublishCommand({
            TopicArn: topic,
            Message: message,
            Subject: subject,
            MessageGroupId: messageGroupId,
            MessageDeduplicationId: deduplicationId,
            MessageAttributes: messageAttributes,
          })
        ),
    });
    return {
      message_id: response.MessageId ?? null,
      sequence_number: response.SequenceNumber ?? null,
      topic_arn: topic,
      MessageId: response.MessageId ?? null,
      SequenceNumber: response.SequenceNumber ?? null,
    };
  },
});

export { buildMessageAttributes, validateFifoInput };
