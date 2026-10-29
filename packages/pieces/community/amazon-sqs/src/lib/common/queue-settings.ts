import { Property } from '@activepieces/pieces-framework';
import { parseOptionalInt } from './client';

export const queueSettingsProps = {
  visibilityTimeout: Property.Number({
    displayName: 'Visibility Timeout (seconds)',
    description: '0-43200. AWS default is 30.',
    required: false,
  }),
  messageRetentionPeriod: Property.Number({
    displayName: 'Message Retention (seconds)',
    description: '60-1209600 (14 days). AWS default is 345600 (4 days).',
    required: false,
  }),
  delaySeconds: Property.Number({
    displayName: 'Delivery Delay (seconds)',
    description: '0-900. AWS default is 0.',
    required: false,
  }),
  maximumMessageSize: Property.Number({
    displayName: 'Maximum Message Size (bytes)',
    description: '1024-1048576. AWS default is 1048576 (1 MiB).',
    required: false,
  }),
  receiveMessageWaitTimeSeconds: Property.Number({
    displayName: 'Receive Wait Time (seconds)',
    description: '0-20. Above 0 enables long polling.',
    required: false,
  }),
  deadLetterQueueArn: Property.ShortText({
    displayName: 'Dead-Letter Queue ARN',
    description: 'ARN of the queue that receives failed messages.',
    required: false,
    placeholder: 'arn:aws:sqs:us-east-1:123456789012:my-dlq',
  }),
  maxReceiveCount: Property.Number({
    displayName: 'Max Receive Count',
    description: '1-1000. Receives before a message moves to the DLQ.',
    required: false,
  }),
};

export function buildQueueAttributes(values: QueueSettingsInput): Record<string, string> {
  const attributes: Record<string, string> = {};
  const numeric = [
    { key: 'VisibilityTimeout', name: 'Visibility Timeout', value: values.visibilityTimeout, min: 0, max: 43200 },
    { key: 'MessageRetentionPeriod', name: 'Message Retention', value: values.messageRetentionPeriod, min: 60, max: 1209600 },
    { key: 'DelaySeconds', name: 'Delivery Delay', value: values.delaySeconds, min: 0, max: 900 },
    { key: 'MaximumMessageSize', name: 'Maximum Message Size', value: values.maximumMessageSize, min: 1024, max: 1048576 },
    { key: 'ReceiveMessageWaitTimeSeconds', name: 'Receive Wait Time', value: values.receiveMessageWaitTimeSeconds, min: 0, max: 20 },
  ];
  for (const item of numeric) {
    const parsed = parseOptionalInt({ value: item.value, name: item.name, min: item.min, max: item.max });
    if (parsed !== undefined) {
      attributes[item.key] = String(parsed);
    }
  }
  const dlqArn = values.deadLetterQueueArn?.trim();
  const maxReceiveCount = parseOptionalInt({ value: values.maxReceiveCount, name: 'Max Receive Count', min: 1, max: 1000 });
  if (dlqArn || maxReceiveCount !== undefined) {
    if (!dlqArn || maxReceiveCount === undefined) {
      throw new Error('Fill both "Dead-Letter Queue ARN" and "Max Receive Count" to set a redrive policy.');
    }
    if (!dlqArn.startsWith('arn:')) {
      throw new Error('Dead-Letter Queue ARN must be a queue ARN, e.g. arn:aws:sqs:us-east-1:123456789012:my-dlq.');
    }
    attributes['RedrivePolicy'] = JSON.stringify({
      deadLetterTargetArn: dlqArn,
      maxReceiveCount: String(maxReceiveCount),
    });
  }
  return attributes;
}

export function toTagMap(value: unknown): Record<string, string> | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const result: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    const tagKey = key.trim();
    if (tagKey === '' || raw === undefined || raw === null) {
      continue;
    }
    result[tagKey] = typeof raw === 'string' ? raw : JSON.stringify(raw);
  }
  if (Object.keys(result).length > 50) {
    throw new Error('A queue can have at most 50 tags.');
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export function readReceiptHandleEntries({
  entries,
  withTimeout,
}: {
  entries: unknown[] | undefined;
  withTimeout: boolean;
}): ReceiptHandleEntry[] {
  const list = entries ?? [];
  if (list.length === 0 || list.length > 10) {
    throw new Error('Provide between 1 and 10 receipt handles.');
  }
  return list.map((entry, index) => {
    const handle = readField({ entry, key: 'receiptHandle' });
    const receiptHandle = typeof handle === 'string' ? handle.trim() : '';
    if (receiptHandle === '') {
      throw new Error(`Entry ${index + 1} needs a receipt handle.`);
    }
    const visibilityTimeout = withTimeout
      ? parseOptionalInt({ value: readField({ entry, key: 'visibilityTimeout' }), name: `Visibility Timeout of entry ${index + 1}`, min: 0, max: 43200 })
      : undefined;
    if (withTimeout && visibilityTimeout === undefined) {
      throw new Error(`Entry ${index + 1} needs a visibility timeout.`);
    }
    return { id: `entry${index + 1}`, receiptHandle, visibilityTimeout };
  });
}

export function mapBatchResult({
  successful,
  failed,
}: {
  successful: { Id?: string }[] | undefined;
  failed: { Id?: string; Code?: string; Message?: string; SenderFault?: boolean }[] | undefined;
}) {
  const ok = (successful ?? []).map((item) => ({ id: item.Id ?? null }));
  const bad = (failed ?? []).map((item) => ({
    id: item.Id ?? null,
    code: item.Code ?? null,
    message: item.Message ?? null,
    senderFault: item.SenderFault ?? null,
  }));
  return { successful: ok, failed: bad, successCount: ok.length, failureCount: bad.length };
}

function readField({ entry, key }: { entry: unknown; key: string }): unknown {
  if (typeof entry !== 'object' || entry === null) {
    return undefined;
  }
  return Reflect.get(entry, key);
}

export type QueueSettingsInput = {
  visibilityTimeout?: unknown;
  messageRetentionPeriod?: unknown;
  delaySeconds?: unknown;
  maximumMessageSize?: unknown;
  receiveMessageWaitTimeSeconds?: unknown;
  deadLetterQueueArn?: string | null;
  maxReceiveCount?: unknown;
};

export type ReceiptHandleEntry = {
  id: string;
  receiptHandle: string;
  visibilityTimeout: number | undefined;
};
