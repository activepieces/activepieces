import type { SQSClient } from '@aws-sdk/client-sqs';

export async function loadSqs(): Promise<typeof import('@aws-sdk/client-sqs')> {
  return import('@aws-sdk/client-sqs');
}

export function regionFromQueueUrl(queueUrl: string): string | null {
  let host: string;
  try {
    host = new URL(queueUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
  const match =
    /^sqs[.-]([a-z0-9-]+)\.amazonaws\.com(?:\.cn)?$/.exec(host) ??
    /^([a-z0-9-]+)\.queue\.amazonaws\.com(?:\.cn)?$/.exec(host);
  return match ? match[1] : null;
}

export async function createSqsClient({
  auth,
  queueUrl,
}: {
  auth: SqsAuthProps;
  queueUrl?: string;
}): Promise<SQSClient> {
  const { SQSClient: Client } = await loadSqs();
  const urlRegion = queueUrl ? regionFromQueueUrl(queueUrl) : null;
  return new Client({
    credentials: {
      accessKeyId: auth.accessKeyId.trim(),
      secretAccessKey: auth.secretAccessKey.trim(),
    },
    region: urlRegion && urlRegion !== auth.region ? urlRegion : auth.region,
  });
}

export function isAccessDenied(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const name = readStringField({ source: error, key: 'name' }) ?? readStringField({ source: error, key: 'Code' }) ?? '';
  if (INVALID_CREDENTIAL_ERRORS.has(name)) {
    return false;
  }
  if (ACCESS_DENIED_ERRORS.has(name)) {
    return true;
  }
  const metadata: unknown = Reflect.get(error, '$metadata');
  const status =
    typeof metadata === 'object' && metadata !== null
      ? Reflect.get(metadata, 'httpStatusCode')
      : undefined;
  return status === 403 && name === '';
}

export function resolveQueueUrl(props: {
  queueUrl?: string | null;
  manualQueueUrl?: string | null;
}): string {
  const manual = props.manualQueueUrl?.trim();
  if (manual) {
    return manual;
  }
  const selected = props.queueUrl?.trim();
  if (selected) {
    return selected;
  }
  throw new Error(
    'Select a queue or enter its full queue URL in "Queue URL (manual)".'
  );
}

export function parseOptionalInt({
  value,
  name,
  min,
  max,
}: {
  value: unknown;
  name: string;
  min: number;
  max: number;
}): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    throw new Error(`${name} must be a whole number between ${min} and ${max}.`);
  }
  return num;
}

export function toStringMessageAttributes(
  attributes: Record<string, unknown> | undefined | null
): Record<string, { DataType: string; StringValue: string }> | undefined {
  if (!attributes) {
    return undefined;
  }
  const entries = Object.entries(attributes).filter(
    ([key, value]) => key.trim() !== '' && value !== undefined && value !== null
  );
  if (entries.length === 0) {
    return undefined;
  }
  if (entries.length > 10) {
    throw new Error('SQS allows at most 10 message attributes per message.');
  }
  const result: Record<string, { DataType: string; StringValue: string }> = {};
  for (const [key, value] of entries) {
    const lowerKey = key.trim().toLowerCase();
    if (lowerKey.startsWith('aws.') || lowerKey.startsWith('amazon.')) {
      throw new Error(
        `Message attribute "${key.trim()}" is not allowed: names starting with "AWS." or "Amazon." are reserved by Amazon SQS.`
      );
    }
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value);
    if (stringValue === '') {
      throw new Error(`Message attribute "${key}" cannot be empty.`);
    }
    result[key.trim()] = { DataType: 'String', StringValue: stringValue };
  }
  return result;
}

export function normalizeMessage(message: {
  MessageId?: string;
  ReceiptHandle?: string;
  Body?: string;
  MD5OfBody?: string;
  Attributes?: Record<string, string>;
  MessageAttributes?: Record<
    string,
    { StringValue?: string; BinaryValue?: Uint8Array; DataType?: string }
  >;
}) {
  const attributes = message.Attributes ?? {};
  const messageAttributes: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(message.MessageAttributes ?? {})) {
    messageAttributes[key] =
      value.StringValue ??
      (value.BinaryValue
        ? Buffer.from(value.BinaryValue).toString('base64')
        : null);
  }
  const toNumber = (v: string | undefined) => {
    if (v === undefined) {
      return null;
    }
    const num = Number(v);
    return Number.isFinite(num) ? num : null;
  };
  const toIso = (v: string | undefined) => {
    if (v === undefined) {
      return null;
    }
    const date = new Date(Number(v));
    return Number.isFinite(date.getTime()) ? date.toISOString() : v;
  };
  return {
    messageId: message.MessageId ?? null,
    receiptHandle: message.ReceiptHandle ?? null,
    body: message.Body ?? null,
    md5OfBody: message.MD5OfBody ?? null,
    sentAt: toIso(attributes['SentTimestamp']),
    approximateReceiveCount: toNumber(attributes['ApproximateReceiveCount']),
    approximateFirstReceiveAt: toIso(
      attributes['ApproximateFirstReceiveTimestamp']
    ),
    senderId: attributes['SenderId'] ?? null,
    messageGroupId: attributes['MessageGroupId'] ?? null,
    messageDeduplicationId: attributes['MessageDeduplicationId'] ?? null,
    sequenceNumber: attributes['SequenceNumber'] ?? null,
    messageAttributes,
  };
}

const INVALID_CREDENTIAL_ERRORS = new Set([
  'InvalidClientTokenId',
  'SignatureDoesNotMatch',
  'UnrecognizedClientException',
  'IncompleteSignature',
  'InvalidSignatureException',
  'MissingAuthenticationToken',
  'ExpiredToken',
  'ExpiredTokenException',
]);

const ACCESS_DENIED_ERRORS = new Set([
  'AccessDenied',
  'AccessDeniedException',
]);

function readStringField({
  source,
  key,
}: {
  source: object;
  key: string;
}): string | undefined {
  const value = Reflect.get(source, key);
  return typeof value === 'string' ? value : undefined;
}

export type SqsAuthProps = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};
