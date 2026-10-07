import { Kafka, Partitioners, type EachMessagePayload } from 'kafkajs'
import { kafkaConfig, type KafkaAuthInput } from './config'
import { kafkaRecords, type KafkaRecord } from './records'

export const kafkaClient = {
  validate,
  publishMessages,
  pinStartOffsets,
  consume,
}

async function validate(auth: KafkaAuthInput): Promise<{ valid: true } | { valid: false, error: string }> {
  const requirement = kafkaConfig.requirementError(auth)
  if (requirement !== undefined) {
    return { valid: false, error: requirement }
  }
  const admin = new Kafka(kafkaConfig.build(auth)).admin()
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
  const producer = new Kafka(kafkaConfig.build(auth)).producer({
    createPartitioner: Partitioners.DefaultPartitioner,
  })
  try {
    await producer.connect()
    const results: PublishResult[] = []
    for (const message of outbound) {
      const metadata = await producer.send({
        topic: topicName,
        acks: -1,
        messages: [kafkaRecords.toKafkaMessage(message)],
      })
      const record = metadata[0]
      if (record === undefined || record.errorCode !== 0) {
        throw new Error(`Broker returned error code ${record?.errorCode ?? 'unknown'}.`)
      }
      const offset = record.baseOffset ?? record.offset
      if (offset === undefined || offset.length === 0) {
        throw new Error('Kafka did not return an offset for the published message.')
      }
      results.push({
        topic: topicName,
        key: message.key ?? null,
        partition: record.partition,
        offset,
      })
    }
    return results
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
  const admin = new Kafka(kafkaConfig.build(auth)).admin()
  try {
    await admin.connect()
    const [topicOffsets, groupOffsets] = await Promise.all([
      admin.fetchTopicOffsets(topicName),
      admin.fetchOffsets({ groupId, topics: [topicName] }),
    ])
    const partitions = kafkaRecords.startOffsetPlan({
      topicOffsets,
      committed: groupOffsets.find((entry) => entry.topic === topicName)?.partitions ?? [],
      fromBeginning,
    })
    if (partitions.length > 0) {
      await admin.setOffsets({ groupId, topic: topicName, partitions })
    }
  } catch (error) {
    throw new Error(kafkaConfig.describeError({ error, brokers: auth.brokers, topic: topicName }))
  } finally {
    await admin.disconnect().catch(() => undefined)
  }
}

async function consume({ auth, topic, consumerGroup, maxMessages, pollTimeoutSeconds, fromBeginning, commit }: {
  auth: KafkaAuthInput
  topic: string
  consumerGroup: string
  maxMessages: number
  pollTimeoutSeconds: number
  fromBeginning: boolean
  commit: boolean
}): Promise<KafkaRecord[]> {
  const topicName = kafkaConfig.readTopic(topic)
  const groupId = kafkaConfig.readConsumerGroup(consumerGroup)
  const limit = kafkaConfig.readMaxMessages(maxMessages)
  const pollTimeoutMs = kafkaConfig.readPollTimeoutMs(pollTimeoutSeconds)
  if (commit) {
    await pinStartOffsets({ auth, topic: topicName, consumerGroup: groupId, fromBeginning })
  }
  const consumer = new Kafka(kafkaConfig.build(auth)).consumer({
    groupId,
    maxWaitTimeInMs: 500,
    sessionTimeout: 15_000,
    rebalanceTimeout: 15_000,
    heartbeatInterval: 3_000,
  })
  let runResult: Promise<void> = Promise.resolve()
  try {
    await consumer.connect()
    await consumer.subscribe({ topic: topicName, fromBeginning })
    const records: KafkaRecord[] = []
    let runError: unknown
    runResult = consumer.run({
      autoCommit: false,
      eachMessage: async ({ topic: messageTopic, partition, message }: EachMessagePayload) => {
        if (records.length >= limit) {
          return
        }
        records.push(kafkaRecords.toRecord({ topic: messageTopic, partition, message }))
      },
    }).catch((error: unknown) => {
      runError = error
    })
    const deadline = Date.now() + pollTimeoutMs
    let lastCount = 0
    let quietSince = Date.now()
    while (records.length < limit && runError === undefined && Date.now() < deadline) {
      if (records.length > 0 && records.length === lastCount && Date.now() - quietSince >= 500) {
        break
      }
      if (records.length !== lastCount) {
        lastCount = records.length
        quietSince = Date.now()
      }
      await delay(100)
    }
    if (runError !== undefined) {
      throw runError
    }
    if (commit && records.length > 0) {
      await consumer.commitOffsets(kafkaRecords.commitPlan({ topic: topicName, records }))
    }
    return records
  } catch (error) {
    throw new Error(kafkaConfig.describeError({ error, brokers: auth.brokers, topic: topicName }))
  } finally {
    await consumer.stop().catch(() => undefined)
    await runResult.catch(() => undefined)
    await consumer.disconnect().catch(() => undefined)
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export type PublishResult = {
  topic: string
  key: string | null
  partition: number
  offset: string
}
