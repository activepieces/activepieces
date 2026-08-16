import { isNil, tryCatchSync } from '@activepieces/shared';
import { IHeaders, Kafka, KafkaConfig, KafkaMessage, logLevel } from 'kafkajs';

export const kafkaCommon = {
  createClient,
  listTopics,
  parseMessage,
};

function createClient({ props }: { props: KafkaConnectionProps }): Kafka {
  const brokers = props.bootstrapServers
    .split(',')
    .map((broker) => broker.trim())
    .filter((broker) => broker.length > 0);
  if (brokers.length === 0) {
    throw new Error('Bootstrap Servers must contain at least one host:port entry.');
  }
  return new Kafka({
    clientId: 'activepieces',
    brokers,
    ssl: buildSsl({ props }),
    sasl: buildSasl({ props }),
    connectionTimeout: 10_000,
    authenticationTimeout: 10_000,
    logLevel: logLevel.NOTHING,
    retry: {
      initialRetryTime: 300,
      retries: 3,
    },
  });
}

async function listTopics({ props }: { props: KafkaConnectionProps }): Promise<string[]> {
  const admin = createClient({ props }).admin();
  await admin.connect();
  try {
    const topics = await admin.listTopics();
    return topics.filter((topic) => !topic.startsWith('__')).sort();
  }
  finally {
    await admin.disconnect();
  }
}

function parseMessage({
  topic,
  partition,
  message,
}: {
  topic: string;
  partition: number;
  message: KafkaMessage;
}): KafkaMessagePayload {
  return {
    key: message.key?.toString('utf8') ?? null,
    value: parseValue(message.value),
    headers: parseHeaders(message.headers),
    topic,
    partition,
    offset: message.offset,
    timestamp: toIsoTimestamp(message.timestamp),
  };
}

function parseValue(value: Buffer | null): unknown {
  if (isNil(value)) {
    return null;
  }
  const text = value.toString('utf8');
  const { data, error } = tryCatchSync<unknown>(() => JSON.parse(text));
  return error === null ? data : text;
}

function parseHeaders(headers: IHeaders | undefined): Record<string, string | string[] | null> {
  if (isNil(headers)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, parseHeaderValue(value)]),
  );
}

function parseHeaderValue(value: Buffer | string | (Buffer | string)[] | undefined): string | string[] | null {
  if (isNil(value)) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => entry.toString());
  }
  return value.toString();
}

function toIsoTimestamp(timestamp: string): string {
  const epochMillis = Number(timestamp);
  // Brokers report -1 for ancient message formats that carry no timestamp; fall back to receipt time.
  if (!Number.isFinite(epochMillis) || epochMillis <= 0) {
    return new Date().toISOString();
  }
  return new Date(epochMillis).toISOString();
}

function buildSasl({ props }: { props: KafkaConnectionProps }): KafkaConfig['sasl'] {
  switch (props.authMethod) {
    case KafkaAuthMethod.SASL_PLAIN:
      return { mechanism: 'plain', ...requireSaslCredentials({ props }) };
    case KafkaAuthMethod.SASL_SCRAM_256:
      return { mechanism: 'scram-sha-256', ...requireSaslCredentials({ props }) };
    case KafkaAuthMethod.SASL_SCRAM_512:
      return { mechanism: 'scram-sha-512', ...requireSaslCredentials({ props }) };
    default:
      return undefined;
  }
}

function requireSaslCredentials({ props }: { props: KafkaConnectionProps }): { username: string; password: string } {
  const username = props.username?.trim();
  const password = props.password?.trim();
  if (!username || !password) {
    throw new Error('Username and Password are required when using SASL authentication.');
  }
  return { username, password };
}

function buildSsl({ props }: { props: KafkaConnectionProps }): KafkaConfig['ssl'] {
  const ca = normalizePem(props.ca);
  const clientCert = normalizePem(props.clientCert);
  const clientKey = normalizePem(props.clientKey);
  if (props.authMethod === KafkaAuthMethod.MTLS) {
    if (isNil(clientCert) || isNil(clientKey)) {
      throw new Error('Client Certificate and Client Private Key are required when using Mutual TLS.');
    }
    return {
      cert: clientCert,
      key: clientKey,
      ...(isNil(ca) ? {} : { ca: [ca] }),
    };
  }
  const useTls = props.useTls ?? true;
  if (!useTls) {
    return undefined;
  }
  if (isNil(ca) && (isNil(clientCert) || isNil(clientKey))) {
    return true;
  }
  return {
    ...(isNil(ca) ? {} : { ca: [ca] }),
    ...(isNil(clientCert) || isNil(clientKey) ? {} : { cert: clientCert, key: clientKey }),
  };
}

function normalizePem(pem: string | undefined): string | undefined {
  const trimmed = pem?.trim();
  if (isNil(trimmed) || trimmed.length === 0) {
    return undefined;
  }
  // Pasting PEM content into a form often collapses newlines into spaces, which Node's TLS rejects.
  return trimmed.replace(
    /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/g,
    (_match, label: string, body: string) =>
      [`-----BEGIN ${label}-----`, ...body.trim().split(/\s+/), `-----END ${label}-----`].join('\n'),
  );
}

export enum KafkaAuthMethod {
  NONE = 'none',
  SASL_PLAIN = 'plain',
  SASL_SCRAM_256 = 'scram-sha-256',
  SASL_SCRAM_512 = 'scram-sha-512',
  MTLS = 'mtls',
}

export type KafkaConnectionProps = {
  bootstrapServers: string;
  authMethod: KafkaAuthMethod;
  username?: string;
  password?: string;
  useTls?: boolean;
  ca?: string;
  clientCert?: string;
  clientKey?: string;
};

export type KafkaMessagePayload = {
  key: string | null;
  value: unknown;
  headers: Record<string, string | string[] | null>;
  topic: string;
  partition: number;
  offset: string;
  timestamp: string;
};
