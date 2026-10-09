import { randomBytes } from 'crypto';
import {
  connect,
  IClientOptions,
  IClientPublishOptions,
  IClientSubscribeOptions,
  IConnackPacket,
  IPublishPacket,
  MqttClient,
} from 'mqtt';
import type { MqttAuthProps } from '../auth';

function findConfigurationError({ auth }: { auth: MqttAuthProps }): string | null {
  const usesTls = auth.protocol === 'mqtts' || auth.protocol === 'wss';
  switch (auth.authMethod) {
    case 'username_password':
      if (!auth.username || !auth.password) {
        return 'Username and Password are required for the Username / Password method.';
      }
      return null;
    case 'client_certificate':
    case 'client_certificate_and_password':
      if (!usesTls) {
        return 'Client Certificate methods require the mqtts:// or wss:// protocol.';
      }
      if (!auth.clientCertificate || !auth.clientKey) {
        return 'Client Certificate and Client Private Key are required for Client Certificate methods.';
      }
      if (
        auth.authMethod === 'client_certificate_and_password' &&
        (!auth.username || !auth.password)
      ) {
        return 'Username and Password are required for the Client Certificate + Username / Password method.';
      }
      return null;
    case 'token':
      if (!auth.password) {
        return 'Paste the token in Password or Token for the Token method.';
      }
      return null;
    case 'enhanced':
      if (auth.mqttVersion !== '5') {
        return 'Enhanced Authentication requires MQTT 5.0.';
      }
      if (!auth.enhancedAuthMethod) {
        return 'Authentication Method (MQTT 5) is required for Enhanced Authentication.';
      }
      return null;
    default:
      return null;
  }
}

async function verifyConnection({ auth }: { auth: MqttAuthProps }): Promise<void> {
  const { client } = await openConnection({
    auth,
    clientId: generateClientId({ auth }),
    clean: true,
  });
  await closeConnection({ client });
}

async function publish({
  auth,
  topic,
  payload,
  options,
}: {
  auth: MqttAuthProps;
  topic: string;
  payload: Buffer;
  options: IClientPublishOptions;
}): Promise<void> {
  const { client } = await openConnection({
    auth,
    clientId: generateClientId({ auth }),
    clean: true,
  });
  try {
    await client.publishAsync(topic, payload, options);
  } finally {
    await closeConnection({ client });
  }
}

async function receiveMessages({
  auth,
  clientId,
  clean,
  subscription,
  subscribe,
  maxMessages,
  listenMs,
  accept,
}: {
  auth: MqttAuthProps;
  clientId: string;
  clean: boolean;
  subscription: Subscription;
  subscribe: 'always' | 'when_session_missing';
  maxMessages: number;
  listenMs: number;
  accept: (packet: IPublishPacket) => boolean;
}): Promise<ReceivedMessage[]> {
  const received: ReceivedMessage[] = [];
  let acknowledged = 0;
  let reachedLimit: (() => void) | undefined;
  const limitReached = new Promise<void>((resolve) => {
    reachedLimit = resolve;
  });

  const { client, sessionPresent } = await openConnection({
    auth,
    clientId,
    clean,
    onMessage: ({ topic, packet }) => {
      if (accept(packet)) {
        received.push({ topic, packet, receivedAt: new Date().toISOString() });
      }
      if (received.length >= maxMessages) {
        reachedLimit?.();
      }
    },
    customHandleAcks: (_topic, _message, _packet, ack) => {
      if (acknowledged >= maxMessages) {
        reachedLimit?.();
        return;
      }
      acknowledged += 1;
      ack(0);
    },
  });

  try {
    if (subscribe === 'always' || !sessionPresent) {
      await subscribeTo({ client, subscription });
    }
    await Promise.race([limitReached, wait({ ms: listenMs })]);
    await wait({ ms: IN_FLIGHT_GRACE_MS });
  } finally {
    await closeConnection({ client, force: true });
  }
  return received;
}

async function createPersistentSession({
  auth,
  clientId,
  subscription,
}: {
  auth: MqttAuthProps;
  clientId: string;
  subscription: Subscription;
}): Promise<void> {
  const { client } = await openConnection({ auth, clientId, clean: false });
  try {
    await subscribeTo({ client, subscription });
  } finally {
    await closeConnection({ client });
  }
}

async function deletePersistentSession({
  auth,
  clientId,
  topic,
}: {
  auth: MqttAuthProps;
  clientId: string;
  topic: string;
}): Promise<void> {
  const { client } = await openConnection({ auth, clientId, clean: false });
  try {
    await client.unsubscribeAsync(topic);
  } finally {
    await closeConnection({ client });
  }
  const { client: cleanClient } = await openConnection({
    auth,
    clientId,
    clean: true,
    sessionExpirySeconds: 0,
  });
  await closeConnection({ client: cleanClient });
}

function generateClientId({ auth }: { auth: MqttAuthProps }): string {
  const prefix = (auth.clientIdPrefix ?? 'activepieces').trim() || 'activepieces';
  const suffix = randomBytes(6).toString('hex');
  const clientId = `${prefix}_${suffix}`;
  if (auth.mqttVersion === '3') {
    return clientId.slice(-MQTT_31_MAX_CLIENT_ID_LENGTH);
  }
  return clientId;
}

function describeError({ error }: { error: unknown }): string {
  const code = errorCode({ error });
  const message = error instanceof Error ? error.message : String(error);
  switch (code) {
    case 'ENOTFOUND':
    case 'EAI_AGAIN':
      return 'Broker host not found. Check the Host field.';
    case 'ECONNREFUSED':
      return 'Connection refused. Check the Host, Port and Protocol fields.';
    case 'ECONNRESET':
      return 'The broker closed the connection. Check the Protocol (mqtt vs mqtts) and Port.';
    case 'ETIMEDOUT':
    case 'CONNECT_TIMEOUT':
      return 'Connection timed out. Check that the broker is reachable from Activepieces.';
    case 'DEPTH_ZERO_SELF_SIGNED_CERT':
    case 'SELF_SIGNED_CERT_IN_CHAIN':
    case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
    case 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY':
      return 'The broker certificate is not trusted. Paste its CA Certificate, or turn off Verify Server Certificate for testing.';
    case 'CERT_HAS_EXPIRED':
      return 'The broker certificate has expired.';
    case 'ERR_TLS_CERT_ALTNAME_INVALID':
      return 'The broker certificate does not match the host. Set TLS Server Name (SNI) or check the Host.';
    case 4:
    case 134:
      return 'Bad username or password.';
    case 5:
    case 135:
      return 'Not authorized. Check the credentials and the broker access rules (ACL).';
    case 2:
    case 133:
      return 'The broker rejected the Client ID. Change the Client ID Prefix.';
    case 1:
    case 132:
      return 'The broker does not support this MQTT version. Try another MQTT Version.';
    case 140:
      return 'The broker rejected the Enhanced Authentication method.';
    default:
      return message;
  }
}

function openConnection({
  auth,
  clientId,
  clean,
  sessionExpirySeconds,
  onMessage,
  customHandleAcks,
}: {
  auth: MqttAuthProps;
  clientId: string;
  clean: boolean;
  sessionExpirySeconds?: number;
  onMessage?: (params: { topic: string; packet: IPublishPacket }) => void;
  customHandleAcks?: IClientOptions['customHandleAcks'];
}): Promise<OpenConnection> {
  const connectTimeoutMs = (auth.connectTimeoutSeconds ?? 10) * 1000;
  const options = buildClientOptions({
    auth,
    clientId,
    clean,
    sessionExpirySeconds: sessionExpirySeconds ?? (clean ? undefined : SESSION_EXPIRY_SECONDS),
    connectTimeoutMs,
    customHandleAcks,
  });

  return new Promise<OpenConnection>((resolve, reject) => {
    const client = connect(options);
    const timer = setTimeout(() => {
      client.end(true);
      reject(Object.assign(new Error('Connection timed out'), { code: 'CONNECT_TIMEOUT' }));
    }, connectTimeoutMs + 1000);

    if (onMessage) {
      client.on('message', (topic, _payload, packet) => onMessage({ topic, packet }));
    }
    client.once('connect', (connack: IConnackPacket) => {
      clearTimeout(timer);
      resolve({ client, sessionPresent: connack.sessionPresent });
    });
    client.once('error', (error) => {
      clearTimeout(timer);
      client.end(true);
      reject(error);
    });
  });
}

function buildClientOptions({
  auth,
  clientId,
  clean,
  sessionExpirySeconds,
  connectTimeoutMs,
  customHandleAcks,
}: {
  auth: MqttAuthProps;
  clientId: string;
  clean: boolean;
  sessionExpirySeconds: number | undefined;
  connectTimeoutMs: number;
  customHandleAcks: IClientOptions['customHandleAcks'];
}): IClientOptions {
  const protocolVersion = toProtocolVersion({ value: auth.mqttVersion });
  const protocol = toProtocol({ value: auth.protocol });
  const usesCertificate =
    auth.authMethod === 'client_certificate' ||
    auth.authMethod === 'client_certificate_and_password';
  const usesCredentials =
    auth.authMethod === 'username_password' ||
    auth.authMethod === 'client_certificate_and_password' ||
    auth.authMethod === 'token';
  const isWebSocket = protocol === 'ws' || protocol === 'wss';

  return {
    protocol,
    host: auth.host.trim(),
    port: auth.port,
    path: isWebSocket ? auth.path || '/mqtt' : undefined,
    protocolVersion,
    protocolId: protocolVersion === 3 ? 'MQIsdp' : 'MQTT',
    clientId,
    clean,
    keepalive: auth.keepAliveSeconds ?? 60,
    connectTimeout: connectTimeoutMs,
    reconnectPeriod: 0,
    resubscribe: false,
    username: usesCredentials && auth.username ? auth.username : undefined,
    password: usesCredentials && auth.password ? auth.password : undefined,
    cert: usesCertificate ? auth.clientCertificate : undefined,
    key:
      usesCertificate && auth.clientKey
        ? [{ pem: auth.clientKey, passphrase: auth.clientKeyPassphrase || undefined }]
        : undefined,
    ca: auth.caCertificate || undefined,
    rejectUnauthorized: auth.rejectUnauthorized ?? true,
    servername: auth.servername || undefined,
    customHandleAcks,
    properties:
      protocolVersion === 5
        ? {
            ...(sessionExpirySeconds !== undefined ? { sessionExpiryInterval: sessionExpirySeconds } : {}),
            ...(auth.authMethod === 'enhanced' && auth.enhancedAuthMethod
              ? {
                  authenticationMethod: auth.enhancedAuthMethod,
                  authenticationData: Buffer.from(auth.enhancedAuthData ?? '', 'utf8'),
                }
              : {}),
          }
        : undefined,
  };
}

async function subscribeTo({
  client,
  subscription,
}: {
  client: MqttClient;
  subscription: Subscription;
}): Promise<void> {
  const granted = await client.subscribeAsync(subscription.topic, subscription.options);
  const refused = granted.find((grant) => grant.qos === SUBSCRIPTION_REFUSED);
  if (refused) {
    throw new Error(
      `The broker refused the subscription to "${subscription.topic}". Check the topic filter and the broker access rules (ACL).`,
    );
  }
}

async function closeConnection({
  client,
  force = false,
}: {
  client: MqttClient;
  force?: boolean;
}): Promise<void> {
  await client.endAsync(force);
}

function wait({ ms }: { ms: number }): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorCode({ error }: { error: unknown }): string | number | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }
  const { code } = error;
  return typeof code === 'string' || typeof code === 'number' ? code : undefined;
}

function toProtocol({ value }: { value: string }): 'mqtt' | 'mqtts' | 'ws' | 'wss' {
  switch (value) {
    case 'mqtts':
    case 'ws':
    case 'wss':
      return value;
    default:
      return 'mqtt';
  }
}

function toProtocolVersion({ value }: { value: string }): 3 | 4 | 5 {
  switch (value) {
    case '3':
      return 3;
    case '4':
      return 4;
    default:
      return 5;
  }
}

function toQos({ value }: { value: unknown }): QoS {
  switch (String(value)) {
    case '1':
      return 1;
    case '2':
      return 2;
    default:
      return 0;
  }
}

const SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60;
const SUBSCRIPTION_REFUSED = 128;
const IN_FLIGHT_GRACE_MS = 500;
const MQTT_31_MAX_CLIENT_ID_LENGTH = 23;

export const mqttClient = {
  findConfigurationError,
  verifyConnection,
  publish,
  receiveMessages,
  createPersistentSession,
  deletePersistentSession,
  generateClientId,
  describeError,
  toQos,
};

export type Subscription = {
  topic: string;
  options: IClientSubscribeOptions;
};

export type ReceivedMessage = {
  topic: string;
  packet: IPublishPacket;
  receivedAt: string;
};

type QoS = IClientSubscribeOptions['qos'];

type OpenConnection = {
  client: MqttClient;
  sessionPresent: boolean;
};
