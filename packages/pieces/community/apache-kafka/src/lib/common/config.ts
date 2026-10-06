import { logLevel, type KafkaConfig, type SASLOptions } from 'kafkajs'

export const kafkaConfig = {
  parseBrokers,
  requirementError,
  build,
  describeError,
  readTopic,
  readConsumerGroup,
  readMaxMessages,
  readPollTimeoutMs,
  readStartFrom,
}

function parseBrokers(brokers: string): string[] {
  const parsed = brokers
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
  if (parsed.length === 0) {
    throw new Error('Enter at least one broker as host:port, for example kafka.internal:9092.')
  }
  const invalid = parsed.find((entry) => !isHostPort(entry))
  if (invalid !== undefined) {
    throw new Error(`Broker "${invalid}" must be host:port, for example kafka.internal:9092.`)
  }
  return parsed
}

function requirementError(input: KafkaAuthInput): string | undefined {
  try {
    parseBrokers(input.brokers)
  } catch (error) {
    return error instanceof Error ? error.message : 'Enter at least one broker as host:port, for example kafka.internal:9092.'
  }
  if (!isSecurityProtocol(input.securityProtocol)) {
    return 'Choose a security protocol: PLAINTEXT, SSL, SASL_PLAINTEXT, or SASL_SSL.'
  }
  if (!usesSasl(input.securityProtocol)) {
    return undefined
  }
  if (!isSaslMechanism(input.saslMechanism ?? '')) {
    return 'Choose a SASL mechanism: plain, scram-sha-256, or scram-sha-512.'
  }
  const username = input.username?.trim() ?? ''
  if (username.length === 0 || (input.password ?? '').length === 0) {
    return 'SASL username and password are required when the security protocol is SASL_SSL or SASL_PLAINTEXT.'
  }
  return undefined
}

function build(input: KafkaAuthInput): KafkaConfig {
  const requirement = requirementError(input)
  if (requirement !== undefined) {
    throw new Error(requirement)
  }
  const securityProtocol = input.securityProtocol
  if (!isSecurityProtocol(securityProtocol)) {
    throw new Error('Choose a security protocol: PLAINTEXT, SSL, SASL_PLAINTEXT, or SASL_SSL.')
  }
  const caCertificate = input.caCertificate?.trim() ?? ''
  return {
    clientId: 'activepieces',
    brokers: parseBrokers(input.brokers),
    ssl: usesSsl(securityProtocol)
      ? {
        rejectUnauthorized: input.rejectUnauthorized !== false,
        ...(caCertificate.length > 0 ? { ca: [caCertificate] } : {}),
      }
      : undefined,
    sasl: usesSasl(securityProtocol) ? readSasl(input) : undefined,
    logLevel: logLevel.NOTHING,
    connectionTimeout: 10_000,
    authenticationTimeout: 10_000,
    requestTimeout: 15_000,
    retry: {
      retries: 2,
      initialRetryTime: 300,
      maxRetryTime: 3_000,
    },
  }
}

function describeError({ error, brokers, topic }: { error: unknown, brokers: string, topic?: string }): string {
  const raw = errorText(error)
  if (isPassthrough(raw)) {
    return raw
  }
  const target = topic !== undefined && topic.trim().length > 0
    ? `topic "${topic.trim()}" on ${brokers}`
    : `brokers ${brokers}`
  const lower = raw.toLowerCase()
  if (lower.includes('sasl') || lower.includes('authentication') || lower.includes('invalid credentials')) {
    return `Kafka authentication failed for ${target}. Check the SASL mechanism, username, and password. ${raw}`
  }
  if (lower.includes('ssl') || lower.includes('tls') || lower.includes('certificate')) {
    return `Kafka SSL handshake failed for ${target}. Check the security protocol, the CA certificate, and whether server certificate verification is enabled. ${raw}`
  }
  if (
    lower.includes('econnrefused')
    || lower.includes('connection timeout')
    || lower.includes('connection error')
    || lower.includes('failed to connect')
    || lower.includes('timed out')
  ) {
    return `Could not reach Kafka ${target}. Check the bootstrap servers and that this worker can open a connection to them. ${raw}`
  }
  if (lower.includes('unknown topic') || lower.includes('does not host this topic') || lower.includes('topic_or_partition') || lower.includes('this server does not host')) {
    return `Kafka topic was not found for ${target}. Check the topic name and that it exists on the cluster. ${raw}`
  }
  return `Kafka request failed for ${target}. ${raw}`
}

function readTopic(topic: string): string {
  const trimmed = topic.trim()
  if (trimmed.length === 0) {
    throw new Error('Enter a topic name, for example orders.')
  }
  return trimmed
}

function readConsumerGroup(consumerGroup: string): string {
  const trimmed = consumerGroup.trim()
  if (trimmed.length === 0) {
    throw new Error('Enter a consumer group id. Use a different group for each flow that should receive every message.')
  }
  return trimmed
}

function readMaxMessages(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 500) {
    throw new Error('Max messages must be a whole number from 1 to 500.')
  }
  return value
}

function readPollTimeoutMs(seconds: number): number {
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > 20) {
    throw new Error('Poll timeout must be a whole number of seconds from 1 to 20.')
  }
  return seconds * 1000
}

function readStartFrom(value: string): boolean {
  if (value === 'beginning') {
    return true
  }
  if (value === 'latest') {
    return false
  }
  throw new Error('Choose whether to start from new messages only or from the beginning of the topic.')
}

function isHostPort(value: string): boolean {
  const separator = value.lastIndexOf(':')
  if (separator <= 0 || separator === value.length - 1) {
    return false
  }
  const port = Number(value.slice(separator + 1))
  return Number.isInteger(port) && port > 0 && port <= 65535 && !value.slice(0, separator).includes(' ')
}

function usesSasl(protocol: SecurityProtocol): boolean {
  return protocol === 'SASL_PLAINTEXT' || protocol === 'SASL_SSL'
}

function usesSsl(protocol: SecurityProtocol): boolean {
  return protocol === 'SSL' || protocol === 'SASL_SSL'
}

function readSasl(input: KafkaAuthInput): SASLOptions {
  const mechanism = input.saslMechanism ?? ''
  const username = input.username?.trim() ?? ''
  const password = input.password ?? ''
  if (mechanism === 'plain' || mechanism === 'scram-sha-256' || mechanism === 'scram-sha-512') {
    return { mechanism, username, password }
  }
  throw new Error('Choose a SASL mechanism: plain, scram-sha-256, or scram-sha-512.')
}

function errorText(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Unknown Kafka error'
  }
  if (error.cause instanceof Error && error.cause.message.length > 0) {
    return `${error.message} ${error.cause.message}`
  }
  return error.message
}

function isPassthrough(message: string): boolean {
  const prefixes = [
    'Enter at least one broker',
    'Broker "',
    'Choose a security protocol',
    'Choose a SASL',
    'SASL username',
    'Enter a topic',
    'Enter a consumer group',
    'Max messages',
    'Poll timeout',
    'Choose whether to start',
    'Message ',
    'Header "',
    'Headers must',
    'Partition must',
    'Kafka did not return an offset',
    'Broker returned error code',
    'Add at least one message',
  ]
  return prefixes.some((prefix) => message.startsWith(prefix))
}

function isSecurityProtocol(value: string): value is SecurityProtocol {
  return value === 'PLAINTEXT' || value === 'SSL' || value === 'SASL_PLAINTEXT' || value === 'SASL_SSL'
}

function isSaslMechanism(value: string): value is SaslMechanism {
  return value === 'plain' || value === 'scram-sha-256' || value === 'scram-sha-512'
}

export type KafkaAuthInput = {
  brokers: string
  securityProtocol: string
  saslMechanism?: string
  username?: string
  password?: string
  rejectUnauthorized?: boolean
  caCertificate?: string
}

export type SecurityProtocol = 'PLAINTEXT' | 'SSL' | 'SASL_PLAINTEXT' | 'SASL_SSL'

export type SaslMechanism = 'plain' | 'scram-sha-256' | 'scram-sha-512'
