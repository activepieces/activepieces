import { randomUUID } from 'node:crypto'
import type { Admin, EachBatchPayload, Kafka, KafkaConfig } from 'kafkajs'
import { kafkaConfig, type KafkaAuthInput } from './config'
import { kafkaRecords, type KafkaRecord, type OutboundMessage, type PublishResult, type ReadTarget } from './records'

async function validate(auth: KafkaAuthInput): Promise<{ valid: true } | { valid: false, error: string }> {
  const requirement = kafkaConfig.requirementError(auth)
  if (requirement !== undefined) {
    return { valid: false, error: requirement }
  }
  const admin = (await createKafka(kafkaConfig.buildForValidation(auth))).admin()
  try {
    await admin.connect()
    await admin.describeCluster()
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: kafkaConfig.describeError({ error, brokers: auth.brokers }),
    }
  } finally {
    await admin.disconnect().catch(() => undefined)
  }
}

async function publishMessages({ auth, topic, messages }: {
  auth: KafkaAuthInput
  topic: string
  messages: unknown
}): Promise<PublishResult[]> {
  const topicName = kafkaConfig.readTopic(topic)
  const outbound = kafkaRecords.readOutboundMessages(messages)
  const { Partitioners } = await import('kafkajs')
  const kafka = await createKafka(kafkaConfig.build(auth))
  const producer = kafka.producer({
    createPartitioner: Partitioners.DefaultPartitioner,
  })
  try {
    const assigned = await assignPartitions({ kafka, topic: topicName, messages: outbound })
    await producer.connect()
    const metadata = await producer.send({
      topic: topicName,
      acks: -1,
      messages: assigned.map((message) => kafkaRecords.toKafkaMessage(message)),
    })
    return kafkaRecords.publishResults({ topic: topicName, messages: assigned, metadata })
  } catch (error) {
    throw new Error(kafkaConfig.describeError({ error, brokers: auth.brokers, topic: topicName }))
  } finally {
    await producer.disconnect().catch(() => undefined)
  }
}

async function pinStartOffsets({ auth, topic, consumerGroup, fromBeginning }: {
  auth: KafkaAuthInput
  topic: string
  consumerGroup: string
  fromBeginning: boolean
}): Promise<void> {
  const topicName = kafkaConfig.readTopic(topic)
  const groupId = kafkaConfig.readConsumerGroup(consumerGroup)
  const admin = (await createKafka(kafkaConfig.build(auth))).admin()
  try {
    await admin.connect()
    await seedOffsets({ admin, topic: topicName, groupId, fromBeginning })
  } catch (error) {
    throw new Error(kafkaConfig.describeError({ error, brokers: auth.brokers, topic: topicName }))
  } finally {
    await admin.disconnect().catch(() => undefined)
  }
}

async function poll({ auth, topic, consumerGroup, maxMessages, pollTimeoutSeconds, fromBeginning }: {
  auth: KafkaAuthInput
  topic: string
  consumerGroup: string
  maxMessages: number
  pollTimeoutSeconds: number
  fromBeginning: boolean
}): Promise<KafkaRecord[]> {
  const topicName = kafkaConfig.readTopic(topic)
  const groupId = kafkaConfig.readConsumerGroup(consumerGroup)
  const limit = kafkaConfig.readMaxMessages(maxMessages)
  const timeoutMs = kafkaConfig.readPollTimeoutMs(pollTimeoutSeconds)
  const kafka = await createKafka(kafkaConfig.build(auth))
  const admin = kafka.admin()
  try {
    await admin.connect()
    const targets = await seedOffsets({ admin, topic: topicName, groupId, fromBeginning })
    await admin.disconnect().catch(() => undefined)
    if (targets.length === 0) {
      return []
    }
    return await readTargets({ kafka, topic: topicName, groupId, targets, limit, timeoutMs, fromBeginning, commit: true })
  } catch (error) {
    throw new Error(kafkaConfig.describeError({ error, brokers: auth.brokers, topic: topicName }))
  } finally {
    await admin.disconnect().catch(() => undefined)
  }
}

async function sample({ auth, topic, consumerGroup, count, pollTimeoutSeconds }: {
  auth: KafkaAuthInput
  topic: string
  consumerGroup: string
  count: number
  pollTimeoutSeconds: number
}): Promise<KafkaRecord[]> {
  const topicName = kafkaConfig.readTopic(topic)
  const liveGroup = kafkaConfig.readConsumerGroup(consumerGroup)
  const limit = kafkaConfig.readMaxMessages(count)
  const timeoutMs = kafkaConfig.readPollTimeoutMs(pollTimeoutSeconds)
  const groupId = `${liveGroup}-activepieces-test-${randomUUID()}`
  const kafka = await createKafka(kafkaConfig.build(auth))
  const admin = kafka.admin()
  try {
    await admin.connect()
    const topicOffsets = await admin.fetchTopicOffsets(topicName)
    let records: KafkaRecord[] = []
    for (const factor of SAMPLE_WINDOW_FACTORS) {
      const targets = kafkaRecords.recentTargets({ topicOffsets, count: limit * factor })
      if (targets.length === 0) {
        return []
      }
      await admin.setOffsets({
        groupId,
        topic: topicName,
        partitions: targets.map((target) => ({ partition: target.partition, offset: target.offset })),
      })
      records = await readTargets({ kafka, topic: topicName, groupId, targets, limit: limit * factor * targets.length, timeoutMs, fromBeginning: true, commit: false })
      if (records.length >= limit || kafkaRecords.reachesLogStart({ topicOffsets, targets })) {
        break
      }
    }
    return kafkaRecords.newestFirst({ records, count: limit })
  } catch (error) {
    if (kafkaConfig.isGroupAuthorizationError(error)) {
      throw new Error(`Kafka refused the test consumer group "${groupId}". Testing reads with a temporary group whose name starts with "${liveGroup}-activepieces-test-". Grant this user a PREFIXED group ACL on "${liveGroup}" (Read and Delete), or test by publishing a message and letting the flow run.`)
    }
    throw new Error(kafkaConfig.describeError({ error, brokers: auth.brokers, topic: topicName }))
  } finally {
    await admin.deleteGroups([groupId]).catch((error: unknown) => {
      console.warn(`Could not delete the temporary Kafka consumer group "${groupId}" after the test. Grant Delete on the PREFIXED group ACL "${liveGroup}" so test groups are removed; until then Kafka keeps it until its offsets expire.`, error instanceof Error ? error.message : String(error))
    })
    await admin.disconnect().catch(() => undefined)
  }
}

async function seedOffsets({ admin, topic, groupId, fromBeginning }: {
  admin: Admin
  topic: string
  groupId: string
  fromBeginning: boolean
}): Promise<ReadTarget[]> {
  const groupOffsets = await admin.fetchOffsets({ groupId, topics: [topic] })
  const topicOffsets = await admin.fetchTopicOffsets(topic)
  const committed = (groupOffsets.find((entry) => entry.topic === topic)?.partitions ?? [])
    .filter((entry) => BigInt(entry.offset) >= BigInt(0))
  const seeded = kafkaRecords.startOffsetPlan({ topicOffsets, committed, fromBeginning })
  if (seeded.length > 0) {
    await admin.setOffsets({ groupId, topic, partitions: seeded })
  }
  return kafkaRecords.pendingTargets({ topicOffsets, committed: [...committed, ...seeded] })
}

async function readTargets({ kafka, topic, groupId, targets, limit, timeoutMs, fromBeginning, commit }: {
  kafka: Kafka
  topic: string
  groupId: string
  targets: ReadTarget[]
  limit: number
  timeoutMs: number
  fromBeginning: boolean
  commit: boolean
}): Promise<KafkaRecord[]> {
  const ends = new Map(targets.map((target) => [target.partition, BigInt(target.end)]))
  const positions = new Map<number, bigint>()
  let assigned: Set<number> | undefined
  const consumer = kafka.consumer({
    groupId,
    maxWaitTimeInMs: 250,
    sessionTimeout: 15_000,
    rebalanceTimeout: 15_000,
    heartbeatInterval: 3_000,
  })
  consumer.on(consumer.events.GROUP_JOIN, ({ payload }) => {
    assigned = new Set(payload.memberAssignment[topic] ?? [])
  })
  try {
    await consumer.connect()
    await consumer.subscribe({ topic, fromBeginning })
    const records: KafkaRecord[] = []
    let collecting = true
    await consumer.run({
      autoCommit: false,
      eachBatchAutoResolve: false,
      eachBatch: async ({ batch, resolveOffset }: EachBatchPayload) => {
        const end = ends.get(batch.partition)
        if (!collecting || end === undefined) {
          return
        }
        let position = positions.get(batch.partition)
        for (const message of batch.messages) {
          const offset = BigInt(message.offset)
          if (offset >= end) {
            break
          }
          if (records.length >= limit) {
            if (position !== undefined) {
              positions.set(batch.partition, position)
            }
            return
          }
          records.push(kafkaRecords.toRecord({ topic: batch.topic, partition: batch.partition, message }))
          resolveOffset(message.offset)
          position = offset + BigInt(1)
        }
        resolveOffset(batch.lastOffset())
        const fetchedUpTo = BigInt(batch.lastOffset()) + BigInt(1)
        const reached = fetchedUpTo < end ? fetchedUpTo : end
        positions.set(batch.partition, position !== undefined && position > reached ? position : reached)
      },
    })
    const deadline = Date.now() + timeoutMs
    while (records.length < limit && !ownTargetsDone({ ends, positions, assigned }) && Date.now() < deadline) {
      await delay(50)
    }
    collecting = false
    const batch = [...records]
    const committed = [...positions.entries()].map(([partition, offset]) => ({ topic, partition, offset: offset.toString() }))
    if (commit && committed.length > 0) {
      await consumer.commitOffsets(committed)
    }
    return batch
  } finally {
    await consumer.stop().catch(() => undefined)
    await consumer.disconnect().catch(() => undefined)
  }
}

async function assignPartitions({ kafka, topic, messages }: {
  kafka: Kafka
  topic: string
  messages: OutboundMessage[]
}): Promise<OutboundMessage[]> {
  if (messages.length === 1 || messages.every((message) => message.partition !== undefined)) {
    return messages
  }
  const { Partitioners } = await import('kafkajs')
  const admin = kafka.admin()
  try {
    await admin.connect()
    const metadata = await admin.fetchTopicMetadata({ topics: [topic] })
    const partitionMetadata = metadata.topics.find((entry) => entry.name === topic)?.partitions ?? []
    const partitioner = Partitioners.DefaultPartitioner()
    return messages.map((message) => message.partition !== undefined
      ? message
      : { ...message, partition: partitioner({ topic, partitionMetadata, message: kafkaRecords.toKafkaMessage(message) }) })
  } finally {
    await admin.disconnect().catch(() => undefined)
  }
}

async function createKafka(config: KafkaConfig): Promise<Kafka> {
  const { Kafka: KafkaClient } = await import('kafkajs')
  return new KafkaClient(config)
}

function ownTargetsDone({ ends, positions, assigned }: {
  ends: Map<number, bigint>
  positions: Map<number, bigint>
  assigned: Set<number> | undefined
}): boolean {
  if (assigned === undefined) {
    return false
  }
  const own = assigned
  return [...ends.entries()]
    .filter(([partition]) => own.has(partition))
    .every(([partition, end]) => (positions.get(partition) ?? BigInt(0)) >= end)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const SAMPLE_WINDOW_FACTORS = [1, 10, 100]

export const kafkaClient = {
  validate,
  publishMessages,
  pinStartOffsets,
  poll,
  sample,
}
