import { type Message } from 'kafkajs'

export const kafkaRecords = {
  toRecord,
  commitPlan,
  readOutboundMessage,
  readOutboundMessages,
  toKafkaMessage,
  toTriggerOutput,
}

function toRecord({ topic, partition, message }: {
  topic: string
  partition: number
  message: {
    key: Buffer | null
    value: Buffer | null
    offset: string
    timestamp: string
    headers?: Record<string, Buffer | string | (Buffer | string)[] | undefined>
  }
}): KafkaRecord {
  return {
    topic,
    partition,
    offset: message.offset,
    key: message.key === null ? null : message.key.toString('utf8'),
    payload: message.value === null ? null : message.value.toString('utf8'),
    headers: headerRecord(message.headers),
    timestamp: message.timestamp,
  }
}

function commitPlan({ topic, records }: {
  topic: string
  records: { partition: number, offset: string }[]
}): { topic: string, partition: number, offset: string }[] {
  const highest = new Map<number, bigint>()
  for (const record of records) {
    const offset = BigInt(record.offset)
    const current = highest.get(record.partition)
    if (current === undefined || offset > current) {
      highest.set(record.partition, offset)
    }
  }
  return [...highest.entries()].map(([partition, offset]) => ({
    topic,
    partition,
    offset: (offset + BigInt(1)).toString(),
  }))
}

function readOutboundMessages(value: unknown): OutboundMessage[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Add at least one message. Each message needs a value.')
  }
  return value.map((item, index) => readOutboundMessage(item, index))
}

function readOutboundMessage(value: unknown, index: number): OutboundMessage {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${messageLabel(index)} must include a value.`)
  }
  const rawValue = readField(value, 'value')
  if (typeof rawValue !== 'string' || rawValue.length === 0) {
    throw new Error(`${messageLabel(index)} needs a value.`)
  }
  return {
    value: rawValue,
    key: readOptionalString(readField(value, 'key'), `${messageLabel(index)} key`),
    partition: readOptionalPartition(readField(value, 'partition'), index),
    headers: readHeadersInput(readField(value, 'headers'), index),
  }
}

function toKafkaMessage(message: OutboundMessage): Message {
  return {
    key: message.key,
    value: message.value,
    headers: message.headers,
    partition: message.partition,
  }
}

function toTriggerOutput({ records, topic, batch }: {
  records: KafkaRecord[]
  topic: string
  batch: boolean
}): KafkaRecord[] | KafkaBatch[] {
  if (!batch) {
    return records
  }
  if (records.length === 0) {
    return []
  }
  return [{
    topic,
    message_count: records.length,
    messages: records,
  }]
}

function headerRecord(headers: Record<string, Buffer | string | (Buffer | string)[] | undefined> | undefined): Record<string, string> {
  if (headers === undefined) {
    return {}
  }
  return Object.entries(headers).reduce<Record<string, string>>((collected, [key, value]) => {
    if (value !== undefined) {
      collected[key] = headerValue(value)
    }
    return collected
  }, {})
}

function headerValue(value: Buffer | string | (Buffer | string)[]): string {
  if (typeof value === 'string') {
    return value
  }
  if (Buffer.isBuffer(value)) {
    return value.toString('utf8')
  }
  return value.map((entry) => (Buffer.isBuffer(entry) ? entry.toString('utf8') : entry)).join(',')
}

function readHeadersInput(value: unknown, index: number): Record<string, string> | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Headers must be an object of text values on ${messageLabel(index)}.`)
  }
  return Object.entries(value).reduce<Record<string, string>>((collected, [key, entry]) => {
    if (typeof entry !== 'string') {
      throw new Error(`Header "${key}" must be text on ${messageLabel(index)}.`)
    }
    collected[key] = entry
    return collected
  }, {})
}

function readOptionalString(value: unknown, label: string): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  if (typeof value !== 'string') {
    throw new Error(`${label} must be text.`)
  }
  return value
}

function readOptionalPartition(value: unknown, index: number): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`Partition must be a whole number starting at 0 on ${messageLabel(index)}.`)
  }
  return value
}

function readField(record: object, key: string): unknown {
  if (!(key in record)) {
    return undefined
  }
  return Reflect.get(record, key)
}

function messageLabel(index: number): string {
  return `Message ${index + 1}`
}

export type KafkaRecord = {
  topic: string
  partition: number
  offset: string
  key: string | null
  payload: string | null
  headers: Record<string, string>
  timestamp: string
}

export type KafkaBatch = {
  topic: string
  message_count: number
  messages: KafkaRecord[]
}

export type OutboundMessage = {
  key?: string
  value: string
  headers?: Record<string, string>
  partition?: number
}
