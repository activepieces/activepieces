import { randomUUID } from 'node:crypto'
import type { Admin, EachMessagePayload, Kafka, KafkaConfig } from 'kafkajs'
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
    const targets = kafkaRecords.recentTargets({ topicOffsets: await admin.fetchTopicOffsets(topicName), count: limit })
    if (targets.length === 0) {
      return []
    }
    await admin.setOffsets({
      groupId,
      topic: topicName,
      partitions: targets.map((target) => ({ partition: target.partition, offset: target.offset })),
    })
    const records = await readTargets({ kafka, topic: topicName, groupId, targets, limit: limit * targets.length, timeoutMs, fromBeginning: true, commit: false })
    return kafkaRecords.newestFirst({ records, count: limit })
  } catch (error) {
    throw new Error(kafkaConfig.describeError({ error, brokers: auth.brokers, topic: topicName }))
  } finally {
    await admin.deleteGroups([groupId]).catch(() => undefined)
    await admin.disconnect().catch(() => undefined)
  }
}

async function seedOffsets({ admin, topic, groupId, fromBeginning }: {
  admin: Admin
  topic: string
  groupId: string
  fromBeginning: boolean
}): Promise<ReadTarget[]> {
  const [topicOffsets, groupOffsets] = await Promise.all([
    admin.fetchTopicOffsets(topic),
    admin.fetchOffsets({ groupId, topics: [topic] }),
  ])
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
  const done = new Set<number>()
  const consumer = kafka.consumer({
    groupId,
    maxWaitTimeInMs: 250,
    sessionTimeout: 15_000,
    rebalanceTimeout: 15_000,
    heartbeatInterval: 3_000,
  })
  try {
    await consumer.connect()
    await consumer.subscribe({ topic, fromBeginning })
    const records: KafkaRecord[] = []
    let collecting = true
    await consumer.run({
      autoCommit: false,
      eachMessage: async ({ topic: messageTopic, partition, message }: EachMessagePayload) => {
        const end = ends.get(partition)
        if (!collecting || records.length >= limit || end === undefined || BigInt(message.offset) >= end) {
          return
        }
        records.push(kafkaRecords.toRecord({ topic: messageTopic, partition, message }))
        if (BigInt(message.offset) + BigInt(1) >= end) {
          done.add(partition)
        }
      },
    })
    const deadline = Date.now() + timeoutMs
    while (records.length < limit && done.size < ends.size && Date.now() < deadline) {
      await delay(50)
    }
    collecting = false
    const batch = [...records]
    if (commit && batch.length > 0) {
      await consumer.commitOffsets(kafkaRecords.commitPlan({ topic, records: batch }))
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export const kafkaClient = {
  validate,
  publishMessages,
  pinStartOffsets,
  poll,
  sample,
}
