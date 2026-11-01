import { OutputSchema, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import amqp, { Channel, ChannelModel, ConfirmChannel, GetMessage } from 'amqplib';
import type { rabbitmqAuth } from '../auth';

function createAmqpURI(auth: RabbitmqAuthProps): string {
  const scheme = auth.useTls ? 'amqps' : 'amqp';
  const port = auth.port ?? (auth.useTls ? 5671 : 5672);
  const credentials = `${encodeURIComponent(auth.username)}:${encodeURIComponent(auth.password)}`;
  const uri = `${scheme}://${credentials}@${auth.host}:${port}`;
  if (!auth.vhost) {
    return uri;
  }
  return `${uri}/${encodeURIComponent(auth.vhost)}`;
}

async function connect(auth: RabbitmqAuthProps): Promise<ChannelModel> {
  return amqp.connect(createAmqpURI(auth));
}

function toPieceError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  const notFound = /no (queue|exchange) '([^']*)' in vhost '([^']*)'/.exec(message);
  if (notFound) {
    const kind = notFound[1] === 'queue' ? 'Queue' : 'Exchange';
    return new Error(`${kind} "${notFound[2]}" does not exist in vhost "${notFound[3]}".`);
  }
  if (/ACCESS_REFUSED|403/.test(message)) {
    return new Error(`RabbitMQ refused access: ${message}`);
  }
  return error instanceof Error ? error : new Error(message);
}

async function runWithChannel<C extends Channel, T>({
  auth,
  open,
  fn,
}: {
  auth: RabbitmqAuthProps;
  open: (connection: ChannelModel) => Promise<C>;
  fn: (channel: C) => Promise<T>;
}): Promise<T> {
  const connection = await connect(auth);
  let brokerError: unknown;
  let channelClosed = false;
  const captureError = (error: unknown): void => {
    brokerError ??= error;
  };
  connection.on('error', captureError);
  let channel: C | undefined;
  try {
    channel = await open(connection);
    channel.on('error', captureError);
    channel.on('close', () => {
      channelClosed = true;
    });
    return await fn(channel);
  } catch (error) {
    throw toPieceError(brokerError ?? error);
  } finally {
    if (channel && !channelClosed) {
      await channel.close().catch(() => undefined);
    }
    await connection.close().catch(() => undefined);
  }
}

async function withChannel<T>({
  auth,
  fn,
}: {
  auth: RabbitmqAuthProps;
  fn: (channel: Channel) => Promise<T>;
}): Promise<T> {
  return runWithChannel({ auth, open: (connection) => connection.createChannel(), fn });
}

async function withConfirmChannel<T>({
  auth,
  fn,
}: {
  auth: RabbitmqAuthProps;
  fn: (channel: ConfirmChannel) => Promise<T>;
}): Promise<T> {
  return runWithChannel({ auth, open: (connection) => connection.createConfirmChannel(), fn });
}

function toBuffer(data: unknown): Buffer {
  if (typeof data === 'string') {
    return Buffer.from(data);
  }
  return Buffer.from(JSON.stringify(data ?? null));
}

function parseHeaders(headers: unknown): Record<string, unknown> | undefined {
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    return undefined;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key] = value;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

async function publish({
  auth,
  target,
  data,
  options,
}: {
  auth: RabbitmqAuthProps;
  target: PublishTarget;
  data: unknown;
  options: PublishOptions;
}): Promise<PublishResult> {
  const content = toBuffer(data);
  const publishOptions = {
    persistent: options.persistent ?? true,
    contentType: options.contentType || (typeof data === 'string' ? 'text/plain' : 'application/json'),
    headers: parseHeaders(options.headers),
  };
  return withConfirmChannel({
    auth,
    fn: async (channel) => {
      if (target.type === 'queue') {
        await channel.checkQueue(target.queue);
        channel.sendToQueue(target.queue, content, publishOptions);
      } else {
        await channel.checkExchange(target.exchange);
        channel.publish(target.exchange, target.routingKey, content, publishOptions);
      }
      await channel.waitForConfirms();
      return {
        success: true,
        queue: target.type === 'queue' ? target.queue : null,
        exchange: target.type === 'exchange' ? target.exchange : null,
        routingKey: target.type === 'queue' ? target.queue : target.routingKey,
        sizeBytes: content.length,
        persistent: publishOptions.persistent,
        contentType: publishOptions.contentType,
      };
    },
  });
}

function detectContentType(message: string): string {
  try {
    JSON.parse(message);
    return 'application/json';
  } catch {
    return 'text/plain';
  }
}

function parseContent(message: GetMessage): ParsedMessage {
  const rawContent = message.content.toString('utf8');
  let content: unknown = rawContent;
  try {
    content = JSON.parse(rawContent);
  } catch {
    content = rawContent;
  }
  const { properties, fields } = message;
  return {
    content,
    rawContent,
    properties: {
      contentType: properties.contentType ?? null,
      contentEncoding: properties.contentEncoding ?? null,
      headers: properties.headers ?? {},
      deliveryMode: properties.deliveryMode ?? null,
      priority: properties.priority ?? null,
      correlationId: properties.correlationId ?? null,
      replyTo: properties.replyTo ?? null,
      expiration: properties.expiration ?? null,
      messageId: properties.messageId ?? null,
      timestamp: properties.timestamp ?? null,
      type: properties.type ?? null,
      userId: properties.userId ?? null,
      appId: properties.appId ?? null,
    },
    fields: {
      deliveryTag: fields.deliveryTag,
      redelivered: fields.redelivered,
      exchange: fields.exchange,
      routingKey: fields.routingKey,
      messageCount: 'messageCount' in fields ? fields.messageCount : null,
    },
  };
}

function encodedVhost(auth: RabbitmqAuthProps): string {
  return encodeURIComponent(auth.vhost || '/');
}

let verifiedTlsAgent: Promise<unknown> | undefined;

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

async function managementRequest<T>({
  auth,
  path,
}: {
  auth: RabbitmqAuthProps;
  path: string;
}): Promise<T> {
  if (!auth.managementUrl) {
    throw new Error(
      'This action needs the RabbitMQ Management API. Set "Management API URL" in the connection (for example http://localhost:15672).',
    );
  }
  const base = auth.managementUrl.replace(/\/+$/, '');
  const token = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
  try {
    const response = await httpClient.sendRequest<T>(
      {
        method: HttpMethod.GET,
        url: `${base}/api${path}`,
        headers: { Accept: 'application/json', Authorization: `Basic ${token}` },
        timeout: 30000,
      },
      { dispatcher: await verifiedTls() },
    );
    return response.body;
  } catch (error) {
    const failure = readHttpFailure(error);
    if (failure === undefined) {
      throw error;
    }
    throw new RabbitmqManagementError({
      message: `RabbitMQ Management API request to ${path.split('?')[0]} failed (HTTP ${failure.status}).`,
      status: failure.status,
      responseBody: JSON.stringify(failure.body ?? null).slice(0, 2000),
    });
  }
}

function readHttpFailure(error: unknown): { status: number; body: unknown } | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  const { response } = error;
  if (typeof response !== 'object' || response === null || !('status' in response) || typeof response.status !== 'number') {
    return undefined;
  }
  return { status: response.status, body: 'body' in response ? response.body : undefined };
}

class RabbitmqManagementError extends Error {
  status: number;
  responseBody: string;
  constructor({ message, status, responseBody }: { message: string; status: number; responseBody: string }) {
    super(message);
    this.name = 'RabbitmqManagementError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

const publishOptionProps = {
  persistent: Property.Checkbox({
    displayName: 'Persistent',
    description: 'Ask the broker to write the message to disk so it survives a broker restart (only on durable queues).',
    required: false,
    defaultValue: true,
  }),
  contentType: Property.ShortText({
    displayName: 'Content Type',
    description: 'MIME type set on the message. Defaults to application/json, or text/plain when the data is plain text.',
    required: false,
  }),
  headers: Property.Json({
    displayName: 'Headers',
    description: 'Optional message headers as a JSON object, for example {"source": "activepieces"}.',
    required: false,
  }),
};

export const rabbitmqCommon = {
  toPieceError,
  runWithChannel,
  connect,
  withChannel,
  publish,
  parseContent,
  detectContentType,
  managementRequest,
  encodedVhost,
  publishOptionProps,
};

export type RabbitmqAuthProps = PiecePropValueSchema<typeof rabbitmqAuth>;

export type PublishTarget =
  | { type: 'queue'; queue: string }
  | { type: 'exchange'; exchange: string; routingKey: string };

export type PublishOptions = {
  persistent?: boolean;
  contentType?: string;
  headers?: unknown;
};

export type PublishResult = {
  success: boolean;
  queue: string | null;
  exchange: string | null;
  routingKey: string;
  sizeBytes: number;
  persistent: boolean;
  contentType: string;
};

export type ParsedMessage = {
  content: unknown;
  rawContent: string;
  properties: Record<string, unknown>;
  fields: {
    deliveryTag: number;
    redelivered: boolean;
    exchange: string;
    routingKey: string;
    messageCount: number | null;
  };
};

export const publishOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Confirmed by Broker', format: 'boolean' },
    { key: 'queue', label: 'Queue' },
    { key: 'exchange', label: 'Exchange' },
    { key: 'routingKey', label: 'Routing Key' },
    { key: 'sizeBytes', label: 'Size', format: 'filesize' },
    { key: 'persistent', label: 'Persistent', format: 'boolean' },
    { key: 'contentType', label: 'Content Type' },
  ],
};

export const messageFieldsSchema: OutputSchema['fields'] = [
  { key: 'content', label: 'Content', description: 'Parsed JSON when the body is JSON, otherwise the raw text' },
  { key: 'rawContent', label: 'Raw Content' },
  {
    key: 'properties',
    label: 'Properties',
    children: [
      { key: 'contentType', label: 'Content Type' },
      { key: 'headers', label: 'Headers' },
      { key: 'messageId', label: 'Message ID' },
      { key: 'correlationId', label: 'Correlation ID' },
      { key: 'timestamp', label: 'Timestamp', format: 'number' },
      { key: 'type', label: 'Type' },
      { key: 'appId', label: 'App ID' },
      { key: 'deliveryMode', label: 'Delivery Mode', format: 'number' },
    ],
  },
  {
    key: 'fields',
    label: 'Delivery',
    children: [
      { key: 'exchange', label: 'Exchange' },
      { key: 'routingKey', label: 'Routing Key' },
      { key: 'redelivered', label: 'Redelivered', format: 'boolean' },
      { key: 'deliveryTag', label: 'Delivery Tag', format: 'number' },
    ],
  },
];
