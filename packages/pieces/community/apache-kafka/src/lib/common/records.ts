import type { Message, RecordMetadata } from 'kafkajs'

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

function startOffsetPlan({ topicOffsets, committed, fromBeginning }: {
  topicOffsets: { partition: number, low: string, high: string }[]
  committed: { partition: number, offset: string }[]
  fromBeginning: boolean
}): { partition: number, offset: string }[] {
  const highByPartition = new Map(topicOffsets.map((entry) => [entry.partition, BigInt(entry.high)]))
  const pinned = new Set(committed
    .filter((entry) => {
      const offset = BigInt(entry.offset)
      const high = highByPartition.get(entry.partition)
      return offset >= BigInt(0) && (high === undefined || offset <= high)
    })
    .map((entry) => entry.partition))
  return topicOffsets
    .filter((entry) => !pinned.has(entry.partition))
    .map((entry) => ({ partition: entry.partition, offset: fromBeginning ? entry.low : entry.high }))
}

function readOutboundMessages(value: unknown): OutboundMessage[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Add at least one message. Each message needs a value.')
  }
  return value.map((item, index) => readOutboundMessage({ value: item, index }))
}

function readOutboundMessage({ value, index }: { value: unknown, index: number }): OutboundMessage {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${messageLabel(index)} must include a value.`)
  }
  const rawValue = readField({ record: value, key: 'value' })
  if (typeof rawValue !== 'string' || rawValue.length === 0) {
    throw new Error(`${messageLabel(index)} needs a value.`)
  }
  return {
    value: rawValue,
    key: readOptionalString({ value: readField({ record: value, key: 'key' }), label: `${messageLabel(index)} key` }),
    partition: readOptionalPartition({ value: readField({ record: value, key: 'partition' }), index }),
    headers: readHeadersInput({ value: readField({ record: value, key: 'headers' }), index }),
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

function pendingTargets({ topicOffsets, committed }: {
  topicOffsets: { partition: number, low: string, high: string }[]
  committed: { partition: number, offset: string }[]
}): ReadTarget[] {
  const committedByPartition = new Map(committed.map((entry) => [entry.partition, BigInt(entry.offset)]))
  return topicOffsets.flatMap((entry) => {
    const high = BigInt(entry.high)
    const low = BigInt(entry.low)
    const current = committedByPartition.get(entry.partition)
    const start = current === undefined || current < low ? low : current
    if (start >= high) {
      return []
    }
    return [{ partition: entry.partition, offset: start.toString(), end: entry.high }]
  })
}

function reachesLogStart({ topicOffsets, targets }: {
  topicOffsets: { partition: number, low: string }[]
  targets: ReadTarget[]
}): boolean {
  const lowByPartition = new Map(topicOffsets.map((entry) => [entry.partition, entry.low]))
  return targets.every((target) => lowByPartition.get(target.partition) === target.offset)
}

function recentTargets({ topicOffsets, count }: {
  topicOffsets: { partition: number, low: string, high: string }[]
  count: number
}): ReadTarget[] {
  return topicOffsets.flatMap((entry) => {
    const high = BigInt(entry.high)
    const low = BigInt(entry.low)
    if (high <= low) {
      return []
    }
    const fromCount = high - BigInt(count)
    const start = fromCount > low ? fromCount : low
    return [{ partition: entry.partition, offset: start.toString(), end: entry.high }]
  })
}

function newestFirst({ records, count }: { records: KafkaRecord[], count: number }): KafkaRecord[] {
  return [...records]
    .sort((left, right) => compareBigInt({ left: BigInt(right.timestamp), right: BigInt(left.timestamp) }))
    .slice(0, count)
}

function publishResults({ topic, messages, metadata }: {
  topic: string
  messages: OutboundMessage[]
  metadata: RecordMetadata[]
}): PublishResult[] {
  const nextIndex = new Map<number, number>()
  return messages.map((message) => {
    const record = messages.length === 1 ? metadata[0] : metadata.find((entry) => entry.partition === message.partition)
    if (record === undefined || record.errorCode !== 0) {
      throw new Error(`Broker returned error code ${record?.errorCode ?? 'unknown'}.`)
    }
    const base = record.baseOffset ?? record.offset
    if (base === undefined || base.length === 0) {
      throw new Error('Kafka did not return an offset for the published message.')
    }
    const index = nextIndex.get(record.partition) ?? 0
    nextIndex.set(record.partition, index + 1)
    return {
      topic,
      key: message.key ?? null,
      partition: record.partition,
      offset: (BigInt(base) + BigInt(index)).toString(),
    }
  })
}

function compareBigInt({ left, right }: { left: bigint, right: bigint }): number {
  if (left === right) {
    return 0
  }
  return left < right ? -1 : 1
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

function readHeadersInput({ value, index }: { value: unknown, index: number }): Record<string, string> | undefined {
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

function readOptionalString({ value, label }: { value: unknown, label: string }): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  if (typeof value !== 'string') {
    throw new Error(`${label} must be text.`)
  }
  return value
}

function readOptionalPartition({ value, index }: { value: unknown, index: number }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`Partition must be a whole number starting at 0 on ${messageLabel(index)}.`)
  }
  return value
}

function readField({ record, key }: { record: object, key: string }): unknown {
  if (!(key in record)) {
    return undefined
  }
  return Reflect.get(record, key)
}

function messageLabel(index: number): string {
  return `Message ${index + 1}`
}

export const kafkaRecords = {
  toRecord,
  commitPlan,
  startOffsetPlan,
  readOutboundMessage,
  readOutboundMessages,
  toKafkaMessage,
  toTriggerOutput,
  pendingTargets,
  recentTargets,
  reachesLogStart,
  newestFirst,
  publishResults,
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

export type ReadTarget = {
  partition: number
  offset: string
  end: string
}

export type PublishResult = {
  topic: string
  key: string | null
  partition: number
  offset: string
}
